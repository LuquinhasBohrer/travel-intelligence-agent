import { useCallback, useEffect, useState } from 'react';
import { AppSnapshot, ParsedIntent, TripInput, TripView } from '../shared/types';

const money = (cents: number | null, currency = 'BRL') => cents === null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
const dateLabel = (trip: TripView) => trip.dateHint ? (trip.dateHint.length === 2 ? `Mês ${trip.dateHint}` : trip.dateHint) : 'período não informado';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir esta operação.';

function Icon({ children }: { children: string }) { return <span className="icon" aria-hidden="true">{children}</span>; }

type Notice = { type: 'success' | 'warning' | 'error'; text: string };

export default function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [request, setRequest] = useState('');
  const [preview, setPreview] = useState<ParsedIntent | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const refresh = useCallback(async () => {
    if (!window.travelAgent) throw new Error('A ponte do aplicativo não foi carregada. Feche e abra o app novamente com npm start.');
    const next = await window.travelAgent.getSnapshot();
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    refresh().catch((error) => setNotice({ type: 'error', text: `Falha ao carregar o banco local: ${errorMessage(error)}` }));
  }, [refresh]);

  const selected = snapshot?.trips.find((trip) => trip.id === selectedId) ?? snapshot?.trips[0] ?? null;
  const configuredProviders = snapshot?.providerStatus.filter((provider) => provider.configured).length ?? 0;

  const analyze = async () => {
    if (!request.trim() || busy) return;
    try {
      const parsed = await window.travelAgent.parseIntent(request);
      setPreview(parsed);
      setNotice(parsed.missingFields.length
        ? { type: 'warning', text: `Ainda faltam: ${parsed.missingFields.join(', ')}.` }
        : { type: 'success', text: 'Pedido interpretado. Revise os parâmetros antes de salvar.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Não consegui interpretar o pedido: ${errorMessage(error)}` });
    }
  };

  const inputFromPreview = (parsed: ParsedIntent): TripInput => ({
    rawRequest: parsed.rawRequest,
    origin: parsed.origin,
    destination: parsed.destination,
    departureDate: parsed.departureDate,
    returnDate: parsed.returnDate,
    dateHint: parsed.dateHint,
    durationDays: parsed.durationDays,
    travelers: parsed.travelers,
    budgetCents: parsed.budgetCents,
    flexibilityDays: parsed.flexibilityDays,
    cabinClass: parsed.cabinClass,
    maxStops: parsed.maxStops,
    baggage: parsed.baggage
  });

  const saveAndMaybeSearch = async (search: boolean) => {
    if (!preview || !preview.origin || !preview.destination) return;
    if (search && !preview.departureDate) {
      setNotice({ type: 'warning', text: 'Para consultar ofertas reais, informe uma data completa, por exemplo 15/12/2026. O mês sozinho pode ser salvo, mas não define uma busca.' });
      return;
    }
    setBusy(true);
    try {
      const id = await window.travelAgent.createTrip(inputFromPreview(preview));
      setSelectedId(id);
      if (search) await window.travelAgent.searchTrip(id);
      await refresh();
      setRequest('');
      setPreview(null);
      setNotice(search
        ? { type: 'success', text: configuredProviders ? 'Pesquisa concluída. Consulte os resultados e os logs abaixo.' : 'Viagem salva. Configure um provider de dados reais para consultar ofertas.' }
        : { type: 'success', text: 'Viagem salva no banco local.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Não foi possível salvar ou pesquisar: ${errorMessage(error)}` });
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    if (!selected) return;
    if (!selected.departureDate) {
      setNotice({ type: 'warning', text: 'Esta viagem ainda não tem uma data completa. Crie uma nova solicitação com dia, mês e ano para pesquisar.' });
      return;
    }
    setBusy(true);
    try {
      await window.travelAgent.searchTrip(selected.id);
      await refresh();
      setSelectedId(selected.id);
      setNotice({ type: 'success', text: configuredProviders ? 'Pesquisa atualizada.' : 'Pesquisa executada, mas nenhum provider real está configurado.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Falha na pesquisa: ${errorMessage(error)}` });
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;
    try {
      await window.travelAgent.deleteTrip(selected.id);
      setSelectedId(null);
      await refresh();
      setNotice({ type: 'success', text: 'Viagem removida localmente.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Não foi possível remover a viagem: ${errorMessage(error)}` });
    }
  };

  const canSave = Boolean(preview?.origin && preview?.destination);
  const canSearch = Boolean(canSave && preview?.departureDate);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">TI</div><div><strong>Travel Intelligence</strong><span>Agent desktop</span></div></div>
      <div className="sidebar-section"><span className="eyebrow">Workspace</span><button className="nav-item active"><Icon>⌂</Icon> Visão geral</button><button className="nav-item" onClick={() => document.getElementById('trips')?.scrollIntoView()}><Icon>✈</Icon> Minhas viagens <b>{snapshot?.trips.length ?? 0}</b></button><button className="nav-item" onClick={() => document.getElementById('activity')?.scrollIntoView()}><Icon>◷</Icon> Atividade</button></div>
      <div className="sidebar-section"><span className="eyebrow">Sistema</span><div className="provider-pill"><span className={`status-dot ${configuredProviders ? 'online' : ''}`}></span><div><strong>{configuredProviders ? 'Provider conectado' : 'Modo local'}</strong><small>{configuredProviders ? `${configuredProviders} integração ativa` : 'Nenhuma API configurada'}</small></div></div><div className="sidebar-help">Sem credencial, o app continua funcionando para interpretar e salvar viagens, mas não inventa preços.</div></div>
      <div className="sidebar-footer"><span className="privacy-lock">▣</span><p><strong>Privacidade local</strong><br/>Viagens e histórico ficam neste computador.</p><small>v0.1.0 · MVP</small></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span className="eyebrow">Painel pessoal</span><h1>Bom dia, viajante.</h1><p className="subtitle">Transforme uma intenção em uma decisão de viagem mais inteligente.</p></div><div className="topbar-meta"><span className="real-badge"><i></i> Dados reais quando disponíveis</span><button className="avatar">L</button></div></header>
      <section className="agent-card"><div className="agent-copy"><span className="eyebrow accent">Agente de pesquisa</span><h2>Para onde você quer ir?</h2><p>Escreva naturalmente. Eu extraio origem, destino, data completa, flexibilidade, orçamento e preferências, mostrando o que ainda falta.</p></div><div className="composer"><textarea value={request} onChange={(event) => setRequest(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void analyze(); } }} placeholder="Ex.: Quero viajar de Porto Alegre para Santiago em 15/12/2026, por 7 dias, para duas pessoas. Tenho flexibilidade de até 3 dias." /><div className="composer-footer"><span>Ctrl + Enter para analisar · seus dados permanecem locais</span><button className="primary-button" onClick={analyze} disabled={!request.trim() || busy}>{busy ? 'Processando…' : 'Interpretar pedido  →'}</button></div></div></section>
      {notice && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? '✓' : notice.type === 'warning' ? '!' : '×'}</span>{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
      {preview && <section className="intent-preview"><div><span className="eyebrow">Interpretação do agente · confiança {preview.confidence}</span><h3>{preview.origin ?? 'Origem pendente'} <span>→</span> {preview.destination ?? 'Destino pendente'}</h3><p>{preview.dateHint ? `Período detectado: ${preview.dateHint.length === 2 ? `mês ${preview.dateHint}` : preview.dateHint}` : 'Data ainda não identificada'} · {preview.travelers} passageiro(s) · {preview.durationDays ? `${preview.durationDays} dias` : 'duração em aberto'} · flexibilidade ±{preview.flexibilityDays} dia(s)</p>{!preview.departureDate && <div className="inline-warning">Para pesquisar ofertas, inclua dia, mês e ano. Exemplo: 15/12/2026.</div>}</div><div className="intent-actions"><button className="secondary-button" onClick={() => saveAndMaybeSearch(false)} disabled={!canSave}>Salvar viagem</button><button className="primary-button" onClick={() => saveAndMaybeSearch(true)} disabled={!canSearch || busy}>{canSearch ? 'Salvar e pesquisar  →' : 'Informe a data exata'}</button></div></section>}
      <section className="section-heading" id="trips"><div><span className="eyebrow">Portfólio</span><h2>Minhas viagens</h2></div><span className="muted-label">{snapshot?.trips.length ?? 0} monitorada(s)</span></section>
      {!snapshot?.trips.length ? <section className="empty-state"><div className="empty-orbit">✦</div><h3>Seu próximo destino começa aqui.</h3><p>Descreva uma viagem acima para salvar o plano no banco local. A pesquisa só exibirá ofertas com fonte e link verificáveis.</p><div className="empty-tags"><span>Dados reais</span><span>Histórico local</span><span>Sem links inventados</span></div></section> : <div className="trip-layout"><div className="trip-list">{snapshot.trips.map((trip) => <TripCard key={trip.id} trip={trip} selected={selected?.id === trip.id} onSelect={() => setSelectedId(trip.id)} />)}</div>{selected && <TripDetail trip={selected} busy={busy} onSearch={runSearch} onDelete={deleteSelected} />}</div>}
      <section className="lower-grid" id="activity"><div className="panel"><div className="panel-header"><div><span className="eyebrow">Transparência</span><h3>Última atividade</h3></div><span className="live-label"><i></i> local</span></div>{selected?.logs.length ? <div className="log-list">{selected.logs.slice(0, 6).map((log, index) => <div className="log-row" key={`${log.createdAt}-${index}`}><span className={`log-dot ${log.level}`}></span><span className="log-time">{new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><span>{log.message}</span></div>)}</div> : <p className="panel-empty">As etapas da pesquisa aparecerão aqui, sem ocultar a origem dos dados.</p>}</div><div className="panel integrity-panel"><div className="panel-header"><div><span className="eyebrow">Integridade</span><h3>Contrato de dados</h3></div><span className="shield">✓</span></div><div className="integrity-list"><div><strong>DADO REAL</strong><span>Fonte externa verificável</span></div><div><strong>HISTÓRICO</strong><span>Pesquisas armazenadas localmente</span></div><div><strong>RECOMENDAÇÃO</strong><span>Regra calculada, não promessa</span></div></div></div></section>
    </main>
  </div>;
}

function TripCard({ trip, selected, onSelect }: { trip: TripView; selected: boolean; onSelect: () => void }) {
  return <button className={`trip-card ${selected ? 'selected' : ''}`} onClick={onSelect}><div className="trip-card-top"><span className="trip-icon">✈</span><span className={`trip-status ${trip.status}`}>{trip.status === 'monitoring' ? 'Monitorando' : 'Rascunho'}</span></div><h3>{trip.origin ?? 'Origem'} <span>→</span> {trip.destination ?? 'Destino'}</h3><p>{dateLabel(trip)} {trip.durationDays ? `· ${trip.durationDays} dias` : ''}</p><div className="trip-metrics"><div><span>Menor atual</span><strong>{money(trip.analytics.currentPriceCents)}</strong></div><div><span>Índice</span><strong>{trip.analytics.purchaseIndex ?? '—'}<small>/100</small></strong></div></div></button>;
}

function TripDetail({ trip, busy, onSearch, onDelete }: { trip: TripView; busy: boolean; onSearch: () => void; onDelete: () => void }) {
  const hasExactDate = Boolean(trip.departureDate);
  return <section className="detail-panel"><div className="detail-header"><div><span className="eyebrow">Viagem selecionada</span><h2>{trip.origin ?? 'Origem'} <span>→</span> {trip.destination ?? 'Destino'}</h2><p>{dateLabel(trip)} · {trip.travelers} passageiro(s) · flexibilidade ±{trip.flexibilityDays} dia(s)</p></div><button className="icon-button" onClick={onDelete} title="Remover viagem">×</button></div><div className="stat-grid"><div className="stat"><span>Preço atual</span><strong>{money(trip.analytics.currentPriceCents)}</strong><small>{trip.analytics.currentPriceCents ? 'menor oferta validada' : 'ainda sem oferta'}</small></div><div className="stat"><span>Média histórica</span><strong>{money(trip.analytics.averagePriceCents)}</strong><small>{trip.analytics.historyCount ? `${trip.analytics.historyCount} registro(s)` : 'aguardando coletas'}</small></div><div className="stat"><span>Menor histórico</span><strong>{money(trip.analytics.minimumPriceCents)}</strong><small>somente dados capturados</small></div><div className="stat index-stat"><span>Índice de compra</span><strong>{trip.analytics.purchaseIndex ?? '—'}<small>/100</small></strong><small>{trip.analytics.classification ?? 'sem base suficiente'}</small></div></div>{!hasExactDate && <div className="detail-warning">Esta viagem foi salva como período mensal. Para pesquisar ofertas reais, crie uma solicitação com data completa.</div>}<div className="recommendation"><div className="recommendation-icon">✦</div><div><span className="eyebrow">Leitura do agente</span><strong>{trip.analytics.recommendation ?? 'Ainda não há recomendação'}</strong><p>{trip.analytics.classification ? `Classificação atual: ${trip.analytics.classification.toLowerCase()}.` : 'Execute uma pesquisa real e acumule histórico para habilitar a análise.'}</p></div></div><div className="detail-actions"><button className="primary-button" onClick={onSearch} disabled={busy || !hasExactDate}>{busy ? 'Pesquisando…' : hasExactDate ? 'Pesquisar agora  →' : 'Data exata necessária'}</button><span>Última atualização: {new Date(trip.updatedAt).toLocaleString('pt-BR')}</span></div></section>;
}

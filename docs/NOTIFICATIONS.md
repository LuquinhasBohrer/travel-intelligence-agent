# Notificações

Notificações não estão habilitadas no MVP. O caminho previsto é um motor local de regras que avalia preço-alvo, percentil histórico, queda desde a última captura e oportunidade excepcional. O evento deverá ser persistido em `alerts` antes de qualquer entrega externa para evitar duplicidade.

E-mail e SMS exigem providers com credenciais fornecidas pelo usuário, consentimento explícito, rate limiting, logs sem dados sensíveis e mecanismo de opt-out. WhatsApp só deve ser considerado por API oficial e dentro dos termos aplicáveis. Notificações desktop podem ser implementadas primeiro porque não exigem enviar dados pessoais a terceiros.

Nenhum alerta deve afirmar que um preço vai cair. A redação deve usar linguagem probabilística e diferenciar observação histórica de previsão.

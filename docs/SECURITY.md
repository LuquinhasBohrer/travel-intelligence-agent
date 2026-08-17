# Segurança e privacidade

O aplicativo foi desenhado para manter viagens, histórico, e-mail, telefone e preferências localmente. O renderer usa `contextIsolation: true`, `nodeIntegration: false` e uma ponte preload mínima. O banco é criado na pasta de dados do Electron do usuário e não é enviado automaticamente para serviços externos.

Segredos nunca devem ser commitados. Use variáveis de ambiente ou armazenamento seguro do sistema operacional. O arquivo `.env.example` contém apenas nomes de configuração. Antes de publicar um build, é necessário adicionar proteção adequada para credenciais, por exemplo, cofre do sistema operacional ou criptografia com chave fora do banco.

A superfície externa precisa validar HTTPS, domínio e redirecionamentos. URLs encurtadas, domínios suspeitos, HTTP sem TLS e páginas que imitam marcas devem ser rejeitados. A aplicação deve mostrar a origem e o horário da coleta ao lado de cada oferta.

O MVP não implementa login, notificações nem envio de dados pessoais. Essas capacidades não devem ser ativadas apenas adicionando um botão: exigem consentimento, política de retenção, proteção contra abuso e testes de segurança.

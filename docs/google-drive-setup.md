# Google Drive para fotos clínicas

O RITMA envia a imagem diretamente ao Google Drive do paciente. O documento sincronizado no app guarda o identificador e o link do Drive, além do título, região e descrição. Quando existe vínculo clínico autorizado e o profissional tem e-mail cadastrado, o app concede a esse e-mail acesso de leitura automaticamente.

## Configuração necessária

1. No projeto Google Cloud usado pela aplicação, habilite a Google Drive API.
2. Crie um OAuth Client ID do tipo **Web application**.
3. Cadastre como origens autorizadas somente os domínios reais do app e os endereços locais de desenvolvimento usados pela equipe.
4. Configure `VITE_GOOGLE_OAUTH_CLIENT_ID` no ambiente de build/hosting com o Client ID. Esse identificador é público; não coloque client secrets no navegador.
5. Publique a tela de consentimento OAuth e conclua eventuais verificações exigidas pelo Google antes de liberar o acesso a todos os pacientes.

O escopo usado é `drive.file`, limitado aos arquivos criados pelo RITMA. O paciente precisa autorizar o Drive na primeira foto. A aplicação não compra espaço: as imagens ocupam a cota da conta Google do paciente. O plano de armazenamento e as condições do Google podem mudar.

Sem esse Client ID, o restante do app continua disponível e o upload de fotos fica desabilitado com uma mensagem clara.

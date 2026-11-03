# Painel de revisão de profissionais

O painel só aparece após o Firebase Authentication entregar a custom claim `admin: true`. A interface verifica essa claim e as regras do Firestore também a exigem para listar profissionais, decidir cadastros e ler/gravar o histórico. Um campo de perfil editável pelo usuário não concede acesso.

## Conceder acesso administrativo

1. Consulte no Firebase Console o UID da conta Google que será administradora: **Authentication → Users**.
2. Em uma máquina confiável com acesso ao projeto, instale a ferramenta local:

   ```sh
   cd admin-tools
   npm install
   gcloud auth application-default login
   GOOGLE_CLOUD_PROJECT=ID_DO_PROJETO npm run set-admin -- UID_DO_ADMIN
   ```

   A conta Google usada no `gcloud` precisa ter permissão para administrar usuários do Firebase Authentication. `GOOGLE_CLOUD_PROJECT` é o `projectId` de `firebase-applet-config.json`.
3. Saia e entre de novo no app para atualizar o token. O painel abrirá após a autenticação.
4. Para remover o acesso, remova `admin` das custom claims da pessoa por uma ferramenta confiável com Firebase Admin SDK. Não coloque chaves de service account no app nem no repositório.

O script usa Application Default Credentials da máquina e preserva as outras custom claims existentes. Ele não cria um servidor permanente nem uma função paga. Os custos normais de autenticação, Firestore e hospedagem continuam sujeitos às cotas e ao plano do projeto.

## Revisar uma solicitação

Confira o número e a UF no conselho profissional correspondente e compare o nome cadastrado. O painel não recebe documentos. Depois de confirmar o registro, aprove; em caso de recusa, informe um motivo. A mudança de status e o registro da decisão são gravados juntos em `professionalReviews`.

Os novos cadastros profissionais ficam pendentes e não conseguem abrir o painel clínico até a aprovação. O próprio perfil não pode mudar `crm.status` nem `crm.verified`; a regra do Firestore valida isso no servidor.

## Publicar as regras

Publique `firestore.rules` no mesmo projeto Firebase usado pelo app. Se as regras novas ainda não tiverem sido publicadas, o painel não conseguirá listar a fila, e os cadastros pendentes podem falhar ao sincronizar.

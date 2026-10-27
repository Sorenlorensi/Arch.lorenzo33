# Arch.Lorenzo: site estático (HTML + CSS + JS mínimo)
Sem build, sem Node, sem framework. É só enviar esta pasta.

1. **Supabase:** crie o projeto, rode `schema.sql` e depois `schema_site_settings.sql` no SQL Editor, desative "Allow new users to sign up" (Authentication > Providers > Email), crie o usuário do proprietário e autorize o e-mail em `admin_users` (comando no fim do schema).
2. **config.js:** preencha URL, chave anon (Settings > API), WhatsApp e Instagram. Nunca use a service_role.
3. **Troque `SEU-DOMINIO.com.br`** em `index.html`, `robots.txt` e `sitemap.xml`.
4. **Publicar:** Cloudflare Pages > Direct Upload > envie ESTA pasta (conteúdo, com `index.html` na raiz). Alterações no painel aparecem na hora, sem novo deploy.
5. **Painel:** `seu-dominio/admin/`: projetos com imagens, textos, cores, imagem de destaque e logotipo.
6. **Backup:** exporte `projects` e `leads` em CSV e baixe o bucket `projects` todo mês. O Supabase grátis pode pausar por inatividade.
JS só existe em: `app.js` (lista de projetos e formulário) e `admin/admin.js` (painel).

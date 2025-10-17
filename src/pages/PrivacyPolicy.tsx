import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Política de Privacidade - FinManage</title>
        <meta name="description" content="Política de privacidade do FinManage - Saiba como tratamos seus dados pessoais" />
      </Helmet>

      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FinManage</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">Política de Privacidade</h1>
          
          <section className="mb-8 p-6 bg-muted rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Resumo rápido (em 1 minuto)</h2>
            <p className="text-muted-foreground">
              Nós, da FinManage, tratamos apenas os dados pessoais necessários para oferecer o app de gestão financeira 
              (contas, transações, dívidas, metas). Você autoriza o compartilhamento via Open Finance quando conecta uma 
              conta; pode revogar esse consentimento a qualquer momento. Guardamos logs do consentimento, protegemos os 
              dados com medidas técnicas e organizacionais e damos a você todos os direitos previstos na LGPD (acesso, 
              correção, eliminação, portabilidade etc.). Para detalhes e formulários, leia a versão completa abaixo.
            </p>
          </section>

          <h2 className="text-3xl font-semibold mb-4 mt-8">Versão completa</h2>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">1. Quem somos (controlador)</h3>
            <p className="mb-2"><strong>FinManage</strong></p>
            <p className="mb-2">CNPJ: [A DEFINIR]</p>
            <p className="mb-2">Endereço: [A DEFINIR]</p>
            <p className="mb-2">E-mail para contato: contato@finmanage.com.br</p>
            <p>Encarregado (DPO): dpo@finmanage.com.br</p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">2. Escopo e objetivo desta política</h3>
            <p>
              Esta política explica quais dados coletamos, por que os coletamos, como usamos, por quanto tempo guardamos, 
              com quem compartilhamos, as medidas de segurança que adotamos e como você pode exercer seus direitos. 
              Aplicável a usuários do site, landing pages, app e APIs da FinManage.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">3. Quais dados coletamos</h3>
            <p className="mb-4">Coletamos somente o necessário para operar o serviço e entregar valor:</p>
            
            <h4 className="text-xl font-semibold mb-2">Dados de identificação e contato</h4>
            <p className="mb-4">Nome, e-mail, CPF (quando solicitado/hashed), telefone (quando fornecido).</p>

            <h4 className="text-xl font-semibold mb-2">Dados financeiros (quando autorizado por você)</h4>
            <p className="mb-4">
              Informações de contas, saldos, transações, cartões, produtos e instrumentos financeiros provenientes de 
              conexão via Open Finance ou uploads (CSV/OFX). O compartilhamento via Open Finance requer seu consentimento 
              explícito conforme regulamentação do Banco Central do Brasil.
            </p>

            <h4 className="text-xl font-semibold mb-2">Dados de uso e técnicos</h4>
            <p className="mb-4">
              Dados de sessão, logs, endereço IP, eventos de uso, erros, device fingerprint para segurança e melhoria 
              do produto.
            </p>

            <h4 className="text-xl font-semibold mb-2">Dados de suporte</h4>
            <p className="mb-4">Mensagens trocadas com o suporte, anexos enviados em chamados.</p>

            <h4 className="text-xl font-semibold mb-2">Metadados de consentimento/auditoria</h4>
            <p className="mb-4">Registros de quando, como e para que finalidades você concedeu consentimento.</p>

            <h4 className="text-xl font-semibold mb-2">Cookies e tecnologias similares</h4>
            <p>Para autenticação, preferências e analytics (detalhes na seção Cookies).</p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">4. Base legal para o tratamento</h3>
            <p className="mb-4">Podemos tratar dados nas seguintes bases legais, conforme a LGPD:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Seu consentimento (ex.: conectar conta via Open Finance, envio de leads por e-mail)</li>
              <li>Execução de contrato ou pré-contratual (ex.: prestação do serviço contratado)</li>
              <li>Cumprimento de obrigação legal (ex.: obrigações fiscais e de auditoria)</li>
              <li>Legítimo interesse (ex.: prevenção de fraudes, segurança da plataforma, melhoria de produto), sempre balanceando direitos e liberdades do titular</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">5. Finalidades do tratamento</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e operar o app: autenticação, dashboard, sincronização de contas</li>
              <li>Processamento de transações e categorização automática</li>
              <li>Geração de recomendações e notificações personalizadas (engine de feedback)</li>
              <li>Suporte ao cliente e gestão de chamados</li>
              <li>Cumprimento de obrigações fiscais e contábeis</li>
              <li>Prevenção e detecção de fraudes e segurança da plataforma</li>
              <li>Pesquisa, análise e melhoria do produto (dados agregados/anônimos)</li>
              <li>Envio de comunicações comerciais quando houver consentimento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">6. Integrações e compartilhamento com terceiros</h3>
            <p className="mb-4">Podemos compartilhar dados com:</p>
            
            <h4 className="text-xl font-semibold mb-2">Agregadores e provedores Open Finance</h4>
            <p className="mb-4">
              Para permitir a conexão automática de contas usamos provedores/agregadores autorizados; o compartilhamento 
              depende do seu consentimento e segue o fluxo de consentimento do Open Finance conforme regulamentação do 
              Banco Central do Brasil.
            </p>

            <h4 className="text-xl font-semibold mb-2">Bureaus de crédito (opcional)</h4>
            <p className="mb-4">
              Se você autorizar verificações de score/dívidas, consultamos bureaus (ex.: Serasa/Experian) para compor o 
              perfil de crédito.
            </p>

            <h4 className="text-xl font-semibold mb-2">Prestadores de serviços</h4>
            <p className="mb-4">
              Processadores contratados (hosting, analytics, e-mail) atuam sob contrato que exige confidencialidade e 
              medidas de segurança.
            </p>

            <h4 className="text-xl font-semibold mb-2">Autoridades legais</h4>
            <p>Quando exigido por lei, ordem judicial ou investigação oficial.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">7. Armazenamento e período de retenção</h3>
            <p className="mb-4">
              Guardamos dados pelo tempo necessário para cumprir as finalidades informadas, atender obrigações legais e 
              resolver disputas. Exemplos orientativos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados de transações e contábeis: até 5 anos para fins fiscais e de auditoria</li>
              <li>Dados de autenticação e perfis: enquanto a conta estiver ativa e por período adicional razoável</li>
              <li>Logs e eventos: período limitado (6-24 meses), salvo quando exigido retenção maior por lei</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">8. Segurança dos dados</h3>
            <p>
              Adotamos medidas técnicas e organizacionais compatíveis com as melhores práticas: criptografia em trânsito 
              (TLS), controle de acesso, hashing de segredos sensíveis, backups seguros e monitoramento de incidentes. 
              Seguimos orientações da Autoridade Nacional de Proteção de Dados (ANPD). Em caso de incidente de segurança 
              que leve a risco relevante, notificaremos os titulares e a ANPD quando exigido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">9. Cookies e tracking</h3>
            <p>
              Usamos cookies estritamente necessários (autenticação, sessão), cookies de preferência (personalização) e 
              cookies analíticos (para entender uso do produto). Você pode gerenciar preferências de cookies nas 
              configurações do navegador.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">10. Direitos do titular de dados</h3>
            <p className="mb-4">Você tem, entre outros, os seguintes direitos previstos na LGPD:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Confirmação e acesso aos seus dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Informação sobre compartilhamento</li>
              <li>Revogação do consentimento</li>
              <li>Oposição ao tratamento</li>
            </ul>
            <p className="mb-2">Para exercer qualquer direito:</p>
            <p>
              Envie e-mail para dpo@finmanage.com.br ou use o formulário em Configurações → Privacidade. Responderemos 
              no menor tempo possível e dentro de prazo razoável.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">11. Consentimento e revogação (Open Finance)</h3>
            <p>
              Conexões via Open Finance exigem seu consentimento explícito; mantemos registros desse consentimento (data, 
              escopo, finalidade). Você pode revogar o consentimento a qualquer momento pelo app em Configurações → 
              Conexões, e também junto à instituição autorizada (Open Finance). O compartilhamento somente ocorrerá com 
              sua manifestação ativa conforme regulamentação do Banco Central do Brasil.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">12. Transferências internacionais</h3>
            <p>
              Podemos transferir dados a prestadores fora do Brasil (ex.: serviços de hosting, analytics). Essas 
              transferências são realizadas com garantias apropriadas (contratos, cláusulas de proteção) e em 
              conformidade com a LGPD.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">13. Processamento de dados sensíveis</h3>
            <p>
              Não processamos dados sensíveis (como saúde, origem racial, convicções religiosas etc.) exceto quando 
              expressamente informado e com base legal adequada. Caso algum dado sensível seja compartilhado por engano, 
              tomaremos medidas imediatas para sua exclusão e notificação.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">14. Procedimento em caso de incidente</h3>
            <p>
              Temos plano de resposta a incidentes que inclui identificação, contenção, análise, comunicação e correção. 
              Se houver vazamento com risco relevante, informaremos titulares afetados e a ANPD conforme critérios legais.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">15. Menores de idade</h3>
            <p>
              Nosso serviço é direcionado a maiores de 18 anos. Não coletamos dados de menores sem o consentimento dos 
              pais ou responsáveis. Se houver coleta inadvertida de dados de menores, remova-os imediatamente mediante 
              solicitação comprovada.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">16. Atualizações desta política</h3>
            <p>
              Esta política pode ser atualizada. Data da última alteração: Janeiro de 2025. Notificaremos usuários por 
              e-mail e/ou banner no app quando houver mudanças substanciais.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">17. Contato e exercício de direitos</h3>
            <p className="mb-4">
              Para dúvidas, solicitações ou reclamações relacionadas a privacidade e proteção de dados, contate:
            </p>
            <p className="mb-2"><strong>FinManage — Encarregado de Dados (DPO)</strong></p>
            <p className="mb-2">E-mail: dpo@finmanage.com.br</p>
            <p className="mb-2">Endereço: [A DEFINIR]</p>
            <p>Se preferir, abra um chamado em Ajuda → Suporte no app (categoria "Privacidade / LGPD").</p>
          </section>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-3">18. Observações finais</h3>
            <p>
              Este documento é completo e pronto para uso, mas recomendamos revisão final por um advogado ou especialista 
              em proteção de dados para adequá-lo à realidade operacional, contratos com fornecedores e às obrigações 
              específicas da sua empresa.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>© 2025 FinManage. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
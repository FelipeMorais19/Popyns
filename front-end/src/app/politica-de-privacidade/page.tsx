import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade · POPYNS",
  description:
    "Saiba como a POPYNS coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
};

const LAST_UPDATE = "1º de junho de 2026";

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-back">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </Link>

        <div className="legal-title-block">
          <p className="legal-label">POPYNS · Documentos Legais</p>
          <h1 className="legal-title">Política de Privacidade</h1>
          <p className="legal-updated">Última atualização: {LAST_UPDATE}</p>
        </div>
      </header>

      <main className="legal-content">
        {/* PREÂMBULO */}
        <section className="legal-section">
          <p className="legal-intro">
            A <strong>POPYNS</strong> tem como princípio fundamental o respeito
            à privacidade e à proteção dos seus dados pessoais. Esta Política
            de Privacidade descreve, de forma transparente e acessível, quais
            dados coletamos, por que os coletamos, como os utilizamos,
            compartilhamos e protegemos, e quais são os seus direitos — em
            plena conformidade com a{" "}
            <strong>
              Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
            </strong>
            , o Marco Civil da Internet (Lei nº 12.965/2014) e o Código de
            Defesa do Consumidor (Lei nº 8.078/1990).
          </p>
        </section>

        {/* 1 */}
        <section className="legal-section">
          <h2 className="legal-h2">1. Controlador dos Dados</h2>
          <p>
            O <strong>controlador</strong> dos seus dados pessoais, nos termos
            do art. 5º, VI, da LGPD, é:
          </p>
          <div className="legal-contact">
            <p><strong>POPYNS Tecnologia Ltda.</strong></p>
            <p>CNPJ: a confirmar</p>
            <p>Sede: São Paulo — SP, Brasil</p>
            <p>
              E-mail do Encarregado (DPO):{" "}
              <a href="mailto:privacidade@popyns.com.br" className="legal-link">
                privacidade@popyns.com.br
              </a>
            </p>
          </div>
          <p>
            O Encarregado de Proteção de Dados (DPO) é o canal oficial para
            questões relacionadas ao tratamento dos seus dados. Entre em contato
            pelo e-mail acima para exercer qualquer direito previsto nesta
            Política.
          </p>
        </section>

        {/* 2 */}
        <section className="legal-section">
          <h2 className="legal-h2">2. Quais Dados Coletamos</h2>

          <h3 className="legal-h3">2.1 Dados Fornecidos por Você</h3>
          <ul className="legal-list">
            <li>
              <strong>Identificação:</strong> nome completo, data de nascimento,
              CPF (quando aplicável para profissionais), foto de perfil.
            </li>
            <li>
              <strong>Contato:</strong> endereço de e-mail, número de telefone.
            </li>
            <li>
              <strong>Endereço:</strong> CEP, logradouro, número, complemento —
              usados para identificar profissionais disponíveis na sua região e
              para a prestação do serviço em domicílio.
            </li>
            <li>
              <strong>Dados de Pagamento:</strong> informações de cartão de
              crédito/débito (tokenizadas pelo gateway de pagamento — a POPYNS
              não armazena o número completo do cartão), histórico de transações.
            </li>
            <li>
              <strong>Conteúdo Gerado:</strong> avaliações, comentários e
              fotos publicados na plataforma.
            </li>
            <li>
              <strong>Comunicações:</strong> mensagens trocadas com profissionais
              e com o suporte POPYNS.
            </li>
          </ul>

          <h3 className="legal-h3">2.2 Dados Coletados Automaticamente</h3>
          <ul className="legal-list">
            <li>
              <strong>Dados de Uso:</strong> telas acessadas, funcionalidades
              utilizadas, buscas realizadas, horário de acesso, duração da sessão.
            </li>
            <li>
              <strong>Dados do Dispositivo:</strong> modelo, sistema operacional,
              versão do app, identificador único do dispositivo, idioma
              configurado.
            </li>
            <li>
              <strong>Geolocalização:</strong> localização aproximada (para
              exibir profissionais próximos) e, com permissão explícita,
              localização precisa em tempo real.
            </li>
            <li>
              <strong>Dados de Rede:</strong> endereço IP, operadora, tipo de
              conexão.
            </li>
            <li>
              <strong>Cookies e Tecnologias Similares:</strong> detalhados na
              Seção 8 desta Política.
            </li>
          </ul>

          <h3 className="legal-h3">2.3 Dados de Terceiros</h3>
          <ul className="legal-list">
            <li>
              <strong>Login Social (Google):</strong> quando você cria ou acessa
              sua conta via Google, recebemos seu nome, e-mail e foto de perfil
              públicos, conforme as permissões concedidas pelo respectivo
              provedor.
            </li>
            <li>
              <strong>Parceiros de Pagamento:</strong> confirmação de transações
              e status de pagamento.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section className="legal-section">
          <h2 className="legal-h2">3. Para Quê Usamos Seus Dados</h2>
          <p>
            Tratamos seus dados pessoais apenas nas hipóteses legais previstas
            na LGPD (arts. 7º e 11), sempre para finalidades determinadas,
            explícitas e legítimas:
          </p>

          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Finalidade</th>
                  <th>Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Criação e gerenciamento da conta de usuário</td>
                  <td>Execução de contrato (art. 7º, V)</td>
                </tr>
                <tr>
                  <td>Intermediação de agendamentos e prestação de serviços</td>
                  <td>Execução de contrato (art. 7º, V)</td>
                </tr>
                <tr>
                  <td>Processamento de pagamentos e reembolsos</td>
                  <td>Execução de contrato (art. 7º, V)</td>
                </tr>
                <tr>
                  <td>Exibição de profissionais disponíveis na região</td>
                  <td>Execução de contrato (art. 7º, V)</td>
                </tr>
                <tr>
                  <td>Atendimento ao cliente e resolução de disputas</td>
                  <td>Legítimo interesse (art. 7º, IX)</td>
                </tr>
                <tr>
                  <td>Prevenção a fraudes e segurança da plataforma</td>
                  <td>Legítimo interesse (art. 7º, IX)</td>
                </tr>
                <tr>
                  <td>Cumprimento de obrigações legais e regulatórias</td>
                  <td>Cumprimento de obrigação legal (art. 7º, II)</td>
                </tr>
                <tr>
                  <td>Melhoria de produtos, personalização e análise de uso</td>
                  <td>Legítimo interesse (art. 7º, IX)</td>
                </tr>
                <tr>
                  <td>Comunicações de marketing e promoções</td>
                  <td>Consentimento (art. 7º, I)</td>
                </tr>
                <tr>
                  <td>Pesquisas de satisfação (NPS)</td>
                  <td>Legítimo interesse (art. 7º, IX)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Sempre que o tratamento for baseado em <strong>consentimento</strong>
            , você poderá revogá-lo a qualquer momento, sem comprometer a
            licitude do tratamento realizado anteriormente.
          </p>
        </section>

        {/* 4 */}
        <section className="legal-section">
          <h2 className="legal-h2">4. Compartilhamento de Dados</h2>
          <p>
            A POPYNS <strong>não vende</strong> seus dados pessoais a terceiros.
            Compartilhamos apenas o estritamente necessário, nas situações a
            seguir:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Profissionais Parceiros:</strong> nome, foto de perfil e
              localização aproximada são compartilhados com o profissional ao
              confirmar um agendamento, para viabilizar a prestação do serviço.
            </li>
            <li>
              <strong>Processadores de Pagamento:</strong> dados necessários
              para concluir transações financeiras, sob acordo de
              confidencialidade e em conformidade com as normas do Banco Central.
            </li>
            <li>
              <strong>Provedores de Infraestrutura (suboperadores):</strong>{" "}
              serviços de nuvem, analytics, autenticação e suporte ao cliente
              — todos submetidos a contratos de proteção de dados adequados.
            </li>
            <li>
              <strong>Autoridades Competentes:</strong> quando exigido por lei,
              decisão judicial ou autoridade regulatória (ANPD, Procon, etc.).
            </li>
            <li>
              <strong>Operações Societárias:</strong> em caso de fusão, aquisição
              ou reorganização empresarial, seus dados poderão ser transferidos
              ao sucessor, que ficará vinculado a esta Política.
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section className="legal-section">
          <h2 className="legal-h2">5. Transferência Internacional de Dados</h2>
          <p>
            Alguns de nossos suboperadores (ex.: serviços de nuvem e autenticação)
            podem processar dados em servidores localizados fora do Brasil.
            Nesse caso, garantimos que as transferências ocorrem apenas para
            países com nível adequado de proteção ou mediante cláusulas
            contratuais padrão aprovadas pela ANPD, nos termos do art. 33 da
            LGPD.
          </p>
        </section>

        {/* 6 */}
        <section className="legal-section">
          <h2 className="legal-h2">6. Por Quanto Tempo Guardamos seus Dados</h2>
          <ul className="legal-list">
            <li>
              <strong>Dados da conta ativa:</strong> pelo período em que a conta
              permanecer ativa, acrescido de até <strong>5 (cinco) anos</strong>{" "}
              após o encerramento, para cumprimento de obrigações legais e
              defesa em processos judiciais ou administrativos (prazo
              prescricional geral do Código Civil).
            </li>
            <li>
              <strong>Dados de transações financeiras:</strong> mínimo de{" "}
              <strong>5 anos</strong>, conforme legislação fiscal e financeira.
            </li>
            <li>
              <strong>Logs de acesso:</strong> mínimo de{" "}
              <strong>6 meses</strong>, conforme art. 15 do Marco Civil da
              Internet.
            </li>
            <li>
              <strong>Dados de marketing (com consentimento):</strong> até a
              revogação do consentimento ou solicitação de exclusão.
            </li>
          </ul>
          <p>
            Após o fim do prazo de retenção, os dados são excluídos ou
            anonimizados de forma segura e irreversível.
          </p>
        </section>

        {/* 7 */}
        <section className="legal-section">
          <h2 className="legal-h2">7. Seus Direitos como Titular</h2>
          <p>
            Nos termos dos arts. 17 a 22 da LGPD, você possui os seguintes
            direitos em relação aos seus dados pessoais:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Confirmação e Acesso:</strong> saber se tratamos seus dados
              e obter uma cópia deles.
            </li>
            <li>
              <strong>Correção:</strong> corrigir dados incompletos, inexatos ou
              desatualizados.
            </li>
            <li>
              <strong>Anonimização, Bloqueio ou Eliminação:</strong> de dados
              desnecessários, excessivos ou tratados em desconformidade com a LGPD.
            </li>
            <li>
              <strong>Portabilidade:</strong> receber seus dados em formato
              estruturado e legível por máquina, quando tecnicamente viável.
            </li>
            <li>
              <strong>Eliminação:</strong> exclusão dos dados tratados com base
              no consentimento, ressalvadas as hipóteses de retenção obrigatória.
            </li>
            <li>
              <strong>Informação sobre Compartilhamento:</strong> saber com quais
              entidades seus dados são compartilhados.
            </li>
            <li>
              <strong>Revogação do Consentimento:</strong> a qualquer tempo, para
              tratamentos baseados em consentimento.
            </li>
            <li>
              <strong>Oposição:</strong> opor-se a tratamentos baseados em
              legítimo interesse, quando houver motivo legítimo.
            </li>
            <li>
              <strong>Petição à ANPD:</strong> peticionar à Autoridade Nacional
              de Proteção de Dados em caso de violação dos seus direitos.
            </li>
          </ul>
          <p>
            Para exercer qualquer desses direitos, entre em contato com nosso
            DPO pelo e-mail{" "}
            <a href="mailto:privacidade@popyns.com.br" className="legal-link">
              privacidade@popyns.com.br
            </a>
            . Responderemos em até <strong>15 (quinze) dias úteis</strong>.
          </p>
        </section>

        {/* 8 */}
        <section className="legal-section">
          <h2 className="legal-h2">8. Cookies e Tecnologias de Rastreamento</h2>
          <p>Utilizamos as seguintes categorias de cookies:</p>
          <ul className="legal-list">
            <li>
              <strong>Essenciais:</strong> necessários para o funcionamento da
              plataforma (autenticação, segurança). Não podem ser desativados.
            </li>
            <li>
              <strong>Funcionais:</strong> armazenam preferências do usuário
              (idioma, localização padrão) para melhorar a experiência.
            </li>
            <li>
              <strong>Analíticos:</strong> coletam dados agregados e anônimos
              sobre o uso da plataforma para melhorias de produto.
            </li>
            <li>
              <strong>Marketing:</strong> usados para exibir anúncios relevantes
              (apenas com seu consentimento explícito).
            </li>
          </ul>
          <p>
            Você pode gerenciar suas preferências de cookies a qualquer momento
            nas configurações do aplicativo ou do navegador.
          </p>
        </section>

        {/* 9 */}
        <section className="legal-section">
          <h2 className="legal-h2">9. Segurança dos Dados</h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger
            seus dados contra acesso não autorizado, perda, destruição ou
            divulgação indevida, incluindo:
          </p>
          <ul className="legal-list">
            <li>Criptografia em trânsito (TLS/HTTPS) e em repouso.</li>
            <li>Controle de acesso baseado em funções (RBAC).</li>
            <li>Autenticação multifator para acesso a sistemas internos.</li>
            <li>Monitoramento contínuo de segurança e testes de intrusão periódicos.</li>
            <li>
              Plano de resposta a incidentes: em caso de violação que possa
              causar risco ou dano relevante, notificaremos a ANPD e os
              titulares afetados no prazo previsto pela LGPD.
            </li>
          </ul>
          <p>
            Nenhum sistema é 100% seguro. Recomendamos que você utilize senhas
            fortes, não as compartilhe e mantenha seu dispositivo atualizado.
          </p>
        </section>

        {/* 10 */}
        <section className="legal-section">
          <h2 className="legal-h2">10. Menores de Idade</h2>
          <p>
            A POPYNS não coleta intencionalmente dados pessoais de menores de
            13 (treze) anos sem consentimento dos pais ou responsáveis legais.
            Caso um menor de 13 anos se cadastre sem autorização, solicitamos
            que os responsáveis entrem em contato para que a conta seja
            excluída.
          </p>
          <p>
            Para usuários entre 13 e 17 anos, o consentimento dos responsáveis
            legais é obrigatório, conforme o art. 14 da LGPD.
          </p>
        </section>

        {/* 11 */}
        <section className="legal-section">
          <h2 className="legal-h2">11. Links para Terceiros</h2>
          <p>
            A plataforma pode conter links para sites e serviços de terceiros.
            Esta Política de Privacidade se aplica exclusivamente à POPYNS. A
            POPYNS não é responsável pelas práticas de privacidade de
            terceiros e recomenda que você leia as políticas de privacidade de
            qualquer serviço externo que venha a acessar.
          </p>
        </section>

        {/* 12 */}
        <section className="legal-section">
          <h2 className="legal-h2">12. Alterações nesta Política</h2>
          <p>
            Esta Política pode ser atualizada periodicamente. Alterações
            relevantes serão comunicadas por notificação no aplicativo ou por
            e-mail, com antecedência mínima de{" "}
            <strong>30 (trinta) dias</strong>. A data da última atualização
            consta sempre no topo do documento.
          </p>
        </section>

        {/* 13 */}
        <section className="legal-section">
          <h2 className="legal-h2">13. Contato e Canal do Encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos, tirar dúvidas ou registrar reclamações
            sobre o tratamento dos seus dados:
          </p>
          <div className="legal-contact">
            <p><strong>Encarregado de Proteção de Dados — POPYNS</strong></p>
            <p>
              E-mail:{" "}
              <a href="mailto:privacidade@popyns.com.br" className="legal-link">
                privacidade@popyns.com.br
              </a>
            </p>
            <p>
              Suporte geral:{" "}
              <a href="mailto:suporte@popyns.com.br" className="legal-link">
                suporte@popyns.com.br
              </a>
            </p>
          </div>
          <p>
            Você também pode registrar reclamação diretamente na{" "}
            <strong>
              Autoridade Nacional de Proteção de Dados (ANPD)
            </strong>
            , pelo site{" "}
            <a
              href="https://www.gov.br/anpd"
              target="_blank"
              rel="noopener noreferrer"
              className="legal-link"
            >
              www.gov.br/anpd
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <p>© 2026 POPYNS · Todos os direitos reservados.</p>
        <Link href="/termos-de-uso" className="legal-link">
          Termos de Uso
        </Link>
      </footer>
    </div>
  );
}

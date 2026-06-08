import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso · POPYNS",
  description:
    "Leia os Termos de Uso da plataforma POPYNS — serviços de beleza onde você está.",
};

const LAST_UPDATE = "1º de junho de 2026";

export default function TermosDeUsoPage() {
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
          <h1 className="legal-title">Termos de Uso</h1>
          <p className="legal-updated">Última atualização: {LAST_UPDATE}</p>
        </div>
      </header>

      <main className="legal-content">
        {/* PREÂMBULO */}
        <section className="legal-section">
          <p className="legal-intro">
            Bem-vinda à <strong>POPYNS</strong>. Antes de usar nossa plataforma,
            leia atentamente estes Termos de Uso. Ao acessar ou utilizar
            qualquer funcionalidade da POPYNS — seja pelo aplicativo móvel ou
            pelo site —, você declara ter lido, compreendido e concordado com
            todas as disposições abaixo, que constituem contrato de adesão nos
            termos do{" "}
            <abbr title="Código de Defesa do Consumidor">CDC</abbr> (Lei nº
            8.078/1990) e do Marco Civil da Internet (Lei nº 12.965/2014).
          </p>
          <p>
            Se você não concordar com estes Termos, não utilize a plataforma.
          </p>
        </section>

        {/* 1 */}
        <section className="legal-section">
          <h2 className="legal-h2">1. Quem somos</h2>
          <p>
            A <strong>POPYNS</strong> é uma plataforma digital de intermediação
            que conecta consumidores a profissionais independentes de beleza e
            estética, viabilizando o agendamento e a contratação de serviços{" "}
            <em>in loco</em> — na residência, local de trabalho ou outro endereço
            indicado pelo usuário.
          </p>
          <p>
            A POPYNS atua exclusivamente como <strong>intermediária
            tecnológica</strong> (marketplace). A execução dos serviços de
            beleza é de responsabilidade direta e exclusiva dos profissionais
            parceiros cadastrados. No entanto, como integrante da cadeia de
            consumo, a POPYNS pode ser acionada solidariamente nos termos do
            art. 7º, parágrafo único, e do art. 25, § 1º, do CDC.
          </p>
        </section>

        {/* 2 */}
        <section className="legal-section">
          <h2 className="legal-h2">2. Elegibilidade e Cadastro</h2>
          <ul className="legal-list">
            <li>
              Para utilizar a POPYNS você deve ter <strong>18 (dezoito)
              anos ou mais</strong> e plena capacidade civil, nos termos do
              Código Civil Brasileiro (Lei nº 10.406/2002).
            </li>
            <li>
              Menores de 18 anos somente poderão utilizar a plataforma mediante
              autorização expressa e supervisão de pais ou responsáveis legais,
              que assumem integralmente a responsabilidade pelo uso.
            </li>
            <li>
              Você é responsável pela veracidade, precisão e atualização de
              todos os dados fornecidos no cadastro. Informações falsas ou
              desatualizadas podem ensejar o cancelamento da conta, sem
              prejuízo de outras medidas legais cabíveis.
            </li>
            <li>
              Cada usuário pode manter apenas <strong>uma conta</strong> ativa.
              A conta é pessoal e intransferível.
            </li>
            <li>
              Você é responsável pela confidencialidade de suas credenciais de
              acesso (e-mail, senha, autenticação social). Em caso de acesso
              não autorizado, notifique imediatamente a POPYNS pelo canal de
              suporte.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section className="legal-section">
          <h2 className="legal-h2">3. Funcionamento da Plataforma</h2>
          <h3 className="legal-h3">3.1 Para Clientes</h3>
          <p>
            Clientes utilizam a POPYNS para pesquisar, comparar e contratar
            profissionais de beleza. O agendamento é confirmado após a aceitação
            pelo profissional e, se aplicável, o processamento do pagamento.
          </p>
          <h3 className="legal-h3">3.2 Para Profissionais Parceiros</h3>
          <p>
            Profissionais de beleza podem se cadastrar como parceiros para
            oferecer seus serviços por meio da plataforma. O cadastro como
            profissional está sujeito a critérios adicionais de elegibilidade,
            verificação de identidade e aceitação de Termos Específicos de
            Parceria, disponíveis separadamente.
          </p>
          <h3 className="legal-h3">3.3 Disponibilidade</h3>
          <p>
            A POPYNS empreende esforços razoáveis para manter a plataforma
            disponível 24h por dia, 7 dias por semana, mas não garante
            disponibilidade ininterrupta. Interrupções para manutenção, atualizações
            ou eventos extraordinários (caso fortuito ou força maior) podem
            ocorrer, preferencialmente em horários de menor uso e com aviso
            prévio sempre que possível.
          </p>
        </section>

        {/* 4 */}
        <section className="legal-section">
          <h2 className="legal-h2">4. Agendamentos, Cancelamentos e Reembolsos</h2>
          <h3 className="legal-h3">4.1 Confirmação do Agendamento</h3>
          <p>
            Um agendamento somente é confirmado após a aceitação expressa pelo
            profissional parceiro e, se o pagamento antecipado for exigido, após
            a confirmação do pagamento.
          </p>
          <h3 className="legal-h3">4.2 Direito de Arrependimento</h3>
          <p>
            Conforme o art. 49 do CDC, o consumidor que contratar serviços à
            distância (por meio eletrônico) tem o direito de se arrepender e
            cancelar o contrato no prazo de <strong>7 (sete) dias corridos</strong>,
            contados da data da contratação, com reembolso integral dos valores
            eventualmente pagos, desde que o serviço ainda não tenha sido
            prestado.
          </p>
          <h3 className="legal-h3">4.3 Política de Cancelamento</h3>
          <ul className="legal-list">
            <li>
              Cancelamentos realizados com mais de{" "}
              <strong>24 horas de antecedência</strong> do horário agendado:
              reembolso integral.
            </li>
            <li>
              Cancelamentos com menos de 24 horas de antecedência: sujeitos à
              taxa de cancelamento conforme política exibida no momento do
              agendamento.
            </li>
            <li>
              Em caso de não comparecimento do profissional parceiro sem aviso
              prévio: reembolso integral garantido pela POPYNS.
            </li>
          </ul>
          <h3 className="legal-h3">4.4 Reembolsos</h3>
          <p>
            Reembolsos aprovados são processados em até 10 (dez) dias úteis,
            pelo mesmo meio de pagamento utilizado na contratação, ressalvadas
            as regras da instituição financeira do usuário.
          </p>
        </section>

        {/* 5 */}
        <section className="legal-section">
          <h2 className="legal-h2">5. Preços e Pagamentos</h2>
          <ul className="legal-list">
            <li>
              Todos os preços exibidos na plataforma são em{" "}
              <strong>Reais (BRL)</strong> e incluem os tributos aplicáveis,
              salvo indicação em contrário.
            </li>
            <li>
              A POPYNS pode cobrar uma <strong>taxa de serviço</strong> sobre
              as transações realizadas pela plataforma. Essa taxa, quando
              aplicável, será exibida de forma clara antes da finalização do
              agendamento.
            </li>
            <li>
              O processamento de pagamentos é realizado por meio de
              processadores terceirizados (ex.: gateways de pagamento)
              devidamente homologados e sujeitos às regulamentações do Banco
              Central do Brasil. A POPYNS não armazena dados completos de
              cartão de crédito.
            </li>
            <li>
              Os preços podem ser atualizados a qualquer momento. A
              atualização não afeta agendamentos já confirmados.
            </li>
          </ul>
        </section>

        {/* 6 */}
        <section className="legal-section">
          <h2 className="legal-h2">6. Regras de Conduta</h2>
          <p>Ao utilizar a POPYNS, você se compromete a:</p>
          <ul className="legal-list">
            <li>Fornecer informações verídicas e mantê-las atualizadas.</li>
            <li>
              Utilizar a plataforma exclusivamente para fins lícitos e em
              conformidade com a legislação brasileira.
            </li>
            <li>
              Não praticar qualquer forma de assédio, discriminação,
              intimidação ou abuso — verbal, físico ou digital — em relação a
              profissionais parceiros, outros usuários ou funcionários da POPYNS.
            </li>
            <li>
              Não realizar tentativas de acesso não autorizado aos sistemas da
              POPYNS, nem engenharia reversa, cópia ou extração indevida de
              dados ou código-fonte.
            </li>
            <li>
              Não utilizar robôs, scrapers ou outros mecanismos automatizados
              para interagir com a plataforma sem autorização prévia e por
              escrito.
            </li>
            <li>
              Não publicar ou transmitir conteúdo ilegal, ofensivo, difamatório,
              discriminatório ou que viole direitos de terceiros.
            </li>
          </ul>
          <p>
            A violação dessas regras pode ensejar a suspensão ou exclusão
            permanente da conta, sem prejuízo de responsabilização civil e
            criminal.
          </p>
        </section>

        {/* 7 */}
        <section className="legal-section">
          <h2 className="legal-h2">7. Avaliações e Conteúdo Gerado pelo Usuário</h2>
          <p>
            A POPYNS permite que usuários publiquem avaliações e comentários
            sobre os serviços contratados. Ao publicar qualquer conteúdo, você:
          </p>
          <ul className="legal-list">
            <li>
              Declara ser o titular ou possuir as devidas autorizações para
              usar o conteúdo publicado.
            </li>
            <li>
              Concede à POPYNS licença não exclusiva, gratuita, sublicenciável
              e global para reproduzir, adaptar, publicar e exibir tal conteúdo
              dentro da plataforma.
            </li>
            <li>
              Compromete-se a publicar avaliações verdadeiras, baseadas em
              experiências reais, sem intenção de prejudicar ilegitimamente a
              reputação de profissionais parceiros.
            </li>
          </ul>
          <p>
            A POPYNS reserva-se o direito de moderar, editar ou remover
            conteúdos que violem estes Termos, a legislação vigente ou os
            padrões da comunidade, nos termos do art. 19 do Marco Civil da
            Internet.
          </p>
        </section>

        {/* 8 */}
        <section className="legal-section">
          <h2 className="legal-h2">8. Propriedade Intelectual</h2>
          <p>
            A marca <strong>POPYNS</strong>, o logotipo, o design, a identidade
            visual, o código-fonte, os algoritmos, os textos, as imagens e
            demais elementos da plataforma são de propriedade exclusiva da
            POPYNS ou de seus licenciadores, protegidos pela Lei de Propriedade
            Industrial (Lei nº 9.279/1996) e pela Lei de Direitos Autorais (Lei
            nº 9.610/1998).
          </p>
          <p>
            É vedado reproduzir, copiar, modificar, distribuir ou utilizar
            qualquer elemento da plataforma sem autorização prévia e por escrito.
          </p>
        </section>

        {/* 9 */}
        <section className="legal-section">
          <h2 className="legal-h2">9. Limitação de Responsabilidade</h2>
          <p>
            Sem prejuízo da responsabilidade solidária prevista pelo CDC, a
            POPYNS não se responsabiliza por:
          </p>
          <ul className="legal-list">
            <li>
              Danos decorrentes do uso inadequado dos serviços pelos
              profissionais parceiros, quando a POPYNS não tiver concorrido
              com culpa ou dolo.
            </li>
            <li>
              Perda de dados por falhas de conectividade do próprio usuário.
            </li>
            <li>
              Conteúdo de sites ou serviços de terceiros vinculados à plataforma.
            </li>
            <li>
              Danos indiretos, lucros cessantes ou perda de oportunidade não
              previstos na relação de consumo.
            </li>
          </ul>
          <p>
            Em qualquer hipótese, a responsabilidade máxima da POPYNS
            ficará limitada ao valor total pago pelo usuário nos 12 (doze)
            meses anteriores ao evento danoso, ressalvados os direitos
            irrenunciáveis do consumidor.
          </p>
        </section>

        {/* 10 */}
        <section className="legal-section">
          <h2 className="legal-h2">10. Privacidade e Proteção de Dados</h2>
          <p>
            O tratamento dos seus dados pessoais é regido pela nossa{" "}
            <Link href="/politica-de-privacidade" className="legal-link">
              Política de Privacidade
            </Link>
            , elaborada em conformidade com a Lei Geral de Proteção de Dados
            (LGPD — Lei nº 13.709/2018). A Política de Privacidade é parte
            integrante destes Termos de Uso.
          </p>
        </section>

        {/* 11 */}
        <section className="legal-section">
          <h2 className="legal-h2">11. Alterações nos Termos</h2>
          <p>
            A POPYNS pode alterar estes Termos a qualquer momento. Alterações
            relevantes serão comunicadas com antecedência mínima de{" "}
            <strong>30 (trinta) dias</strong>, por meio de notificação no
            aplicativo ou por e-mail cadastrado. O uso contínuo da plataforma
            após a entrada em vigor das alterações constitui aceitação dos
            novos Termos.
          </p>
        </section>

        {/* 12 */}
        <section className="legal-section">
          <h2 className="legal-h2">12. Suspensão e Encerramento de Conta</h2>
          <p>
            Você pode encerrar sua conta a qualquer momento pelo próprio
            aplicativo ou entrando em contato com o suporte. A POPYNS pode
            suspender ou encerrar sua conta, com ou sem aviso prévio, em caso
            de violação destes Termos, prática de atos ilícitos ou risco à
            segurança da plataforma.
          </p>
          <p>
            O encerramento da conta não isenta o usuário de obrigações assumidas
            anteriormente, como pagamentos em aberto.
          </p>
        </section>

        {/* 13 */}
        <section className="legal-section">
          <h2 className="legal-h2">13. Lei Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos exclusivamente pelas leis da República
            Federativa do Brasil. Para a resolução de quaisquer controvérsias
            decorrentes deste instrumento, as partes elegem o foro da Comarca
            de <strong>São Paulo/SP</strong>, com renúncia expressa a qualquer
            outro, por mais privilegiado que seja, ressalvada a faculdade do
            consumidor de optar pelo foro de seu domicílio, nos termos do
            art. 101, I, do CDC.
          </p>
        </section>

        {/* 14 */}
        <section className="legal-section">
          <h2 className="legal-h2">14. Contato</h2>
          <p>
            Para dúvidas, reclamações ou exercício de direitos relativos a
            estes Termos, entre em contato:
          </p>
          <div className="legal-contact">
            <p>
              <strong>POPYNS Tecnologia Ltda.</strong>
            </p>
            <p>
              E-mail:{" "}
              <a href="mailto:legal@popyns.com.br" className="legal-link">
                legal@popyns.com.br
              </a>
            </p>
            <p>
              Suporte:{" "}
              <a href="mailto:suporte@popyns.com.br" className="legal-link">
                suporte@popyns.com.br
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="legal-footer">
        <p>© 2026 POPYNS · Todos os direitos reservados.</p>
        <Link href="/politica-de-privacidade" className="legal-link">
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
}

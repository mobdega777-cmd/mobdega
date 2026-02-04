import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: Fevereiro de 2026</p>

          <h2>1. Introdução</h2>
          <p>
            A Mobdega está comprometida em proteger sua privacidade. Esta Política de Privacidade 
            explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais 
            quando você utiliza nossa plataforma.
          </p>

          <h2>2. Informações que Coletamos</h2>
          <p>Podemos coletar os seguintes tipos de informações:</p>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, email, telefone, CPF/CNPJ, endereço</li>
            <li><strong>Dados de uso:</strong> histórico de pedidos, avaliações, favoritos</li>
            <li><strong>Dados de localização:</strong> CEP e endereço para entregas</li>
            <li><strong>Dados técnicos:</strong> IP, tipo de navegador, dispositivo</li>
          </ul>

          <h2>3. Como Usamos Suas Informações</h2>
          <p>Utilizamos suas informações para:</p>
          <ul>
            <li>Processar e entregar seus pedidos</li>
            <li>Personalizar sua experiência na plataforma</li>
            <li>Enviar comunicações relevantes sobre seus pedidos</li>
            <li>Melhorar nossos serviços e funcionalidades</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>

          <h2>4. Compartilhamento de Dados</h2>
          <p>
            Compartilhamos suas informações apenas com os estabelecimentos parceiros necessários 
            para processar seus pedidos. Não vendemos seus dados pessoais a terceiros.
          </p>

          <h2>5. Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas 
            informações contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>

          <h2>6. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
            <li>Solicitar a portabilidade de seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>

          <h2>7. Retenção de Dados</h2>
          <p>
            Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades 
            descritas nesta política, a menos que um período de retenção mais longo seja exigido 
            ou permitido por lei.
          </p>

          <h2>8. Menores de Idade</h2>
          <p>
            Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente 
            informações de menores de idade.
          </p>

          <h2>9. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
            quaisquer alterações significativas através da plataforma ou por email.
          </p>

          <h2>10. Contato</h2>
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato 
            pelo email: privacidade@mobdega.com.br
          </p>
        </div>
      </main>
    </div>
  );
};

export default PoliticaPrivacidade;

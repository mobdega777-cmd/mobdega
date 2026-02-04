import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Cookies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Política de Cookies</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Política de Cookies</h1>
          <p className="text-muted-foreground">Última atualização: Fevereiro de 2026</p>

          <h2>1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, 
            tablet ou smartphone) quando você visita um site. Eles são amplamente utilizados 
            para fazer os sites funcionarem de maneira mais eficiente e fornecer informações 
            aos proprietários do site.
          </p>

          <h2>2. Como Usamos Cookies</h2>
          <p>A Mobdega utiliza cookies para:</p>
          <ul>
            <li>Manter você conectado à sua conta durante a navegação</li>
            <li>Lembrar suas preferências e configurações</li>
            <li>Entender como você usa nossa plataforma</li>
            <li>Melhorar a performance e funcionalidade do site</li>
            <li>Personalizar sua experiência de navegação</li>
          </ul>

          <h2>3. Tipos de Cookies que Utilizamos</h2>
          
          <h3>Cookies Essenciais</h3>
          <p>
            Necessários para o funcionamento básico da plataforma. Sem eles, recursos como 
            autenticação e carrinho de compras não funcionariam corretamente.
          </p>

          <h3>Cookies de Desempenho</h3>
          <p>
            Coletam informações sobre como os visitantes usam o site, como quais páginas são 
            mais acessadas. Esses dados são usados apenas para melhorar o funcionamento do site.
          </p>

          <h3>Cookies Funcionais</h3>
          <p>
            Permitem que o site lembre de escolhas que você faz (como seu nome de usuário, 
            idioma ou região) e forneça recursos aprimorados e mais personalizados.
          </p>

          <h3>Cookies de Marketing</h3>
          <p>
            Usados para rastrear visitantes em diferentes sites. A intenção é exibir anúncios 
            relevantes e envolventes para o usuário individual.
          </p>

          <h2>4. Gerenciamento de Cookies</h2>
          <p>
            Você pode controlar e/ou excluir cookies como desejar. A maioria dos navegadores 
            permite que você gerencie suas preferências de cookies nas configurações. Veja como 
            fazer isso nos principais navegadores:
          </p>
          <ul>
            <li><strong>Google Chrome:</strong> Configurações {'>'} Privacidade e segurança {'>'} Cookies</li>
            <li><strong>Firefox:</strong> Opções {'>'} Privacidade e Segurança {'>'} Cookies</li>
            <li><strong>Safari:</strong> Preferências {'>'} Privacidade {'>'} Cookies</li>
            <li><strong>Edge:</strong> Configurações {'>'} Cookies e permissões do site</li>
          </ul>

          <h2>5. Cookies de Terceiros</h2>
          <p>
            Alguns cookies são colocados por serviços de terceiros que aparecem em nossas páginas, 
            como ferramentas de análise (Google Analytics) e integrações de redes sociais. Não 
            controlamos esses cookies de terceiros.
          </p>

          <h2>6. Consentimento</h2>
          <p>
            Ao continuar a usar nossa plataforma, você concorda com o uso de cookies conforme 
            descrito nesta política. Você pode retirar seu consentimento a qualquer momento 
            alterando as configurações do seu navegador.
          </p>

          <h2>7. Atualizações desta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente para refletir mudanças em nossas 
            práticas ou por outros motivos operacionais, legais ou regulatórios.
          </p>

          <h2>8. Contato</h2>
          <p>
            Se você tiver dúvidas sobre nossa política de cookies, entre em contato pelo 
            email: contato@mobdega.com.br
          </p>
        </div>
      </main>
    </div>
  );
};

export default Cookies;

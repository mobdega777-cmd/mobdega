import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermosDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Termos de Uso</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: Fevereiro de 2026</p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar a plataforma Mobdega, você concorda em cumprir e estar vinculado aos 
            seguintes termos e condições de uso. Se você não concordar com qualquer parte destes 
            termos, não poderá acessar o serviço.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            A Mobdega é uma plataforma digital que conecta consumidores a adegas e tabacarias, 
            permitindo a visualização de cardápios, realização de pedidos e gestão de estabelecimentos 
            comerciais.
          </p>

          <h2>3. Cadastro e Conta</h2>
          <p>
            Para utilizar determinadas funcionalidades da plataforma, você precisará criar uma conta. 
            Você é responsável por manter a confidencialidade de sua conta e senha, e por restringir 
            o acesso ao seu computador ou dispositivo móvel.
          </p>

          <h2>4. Uso Aceitável</h2>
          <p>Você concorda em não usar a plataforma para:</p>
          <ul>
            <li>Violar qualquer lei ou regulamento aplicável</li>
            <li>Infringir direitos de propriedade intelectual</li>
            <li>Transmitir conteúdo ofensivo, difamatório ou ilegal</li>
            <li>Interferir ou interromper o funcionamento da plataforma</li>
            <li>Criar contas falsas ou manipular avaliações</li>
          </ul>

          <h2>5. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo presente na plataforma, incluindo textos, gráficos, logos, ícones, 
            imagens e software, é de propriedade da Mobdega ou de seus licenciadores e está 
            protegido por leis de propriedade intelectual.
          </p>

          <h2>6. Limitação de Responsabilidade</h2>
          <p>
            A Mobdega atua apenas como intermediária entre consumidores e estabelecimentos comerciais. 
            Não nos responsabilizamos pela qualidade dos produtos ou serviços oferecidos pelos 
            estabelecimentos parceiros.
          </p>

          <h2>7. Modificações dos Termos</h2>
          <p>
            Reservamos o direito de modificar estes termos a qualquer momento. As alterações 
            entrarão em vigor imediatamente após a publicação na plataforma. O uso continuado 
            do serviço após as modificações constitui aceitação dos novos termos.
          </p>

          <h2>8. Cancelamento de Conta</h2>
          <p>
            Você pode solicitar o cancelamento de sua conta a qualquer momento. A Mobdega também 
            se reserva o direito de suspender ou encerrar contas que violem estes termos.
          </p>

          <h2>9. Lei Aplicável</h2>
          <p>
            Estes termos serão regidos e interpretados de acordo com as leis da República 
            Federativa do Brasil, sem considerar conflitos de disposições legais.
          </p>

          <h2>10. Contato</h2>
          <p>
            Para questões relacionadas a estes Termos de Uso, entre em contato conosco pelo 
            email: contato@mobdega.com.br
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermosDeUso;

import { ArrowLeft, Target, Heart, Users, Zap, Award, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logoMobdega from "@/assets/logo-mobdega.png";

const SobreNos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Sobre Nós</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <img 
            src={logoMobdega} 
            alt="Mobdega" 
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            A plataforma que conecta você às melhores adegas e tabacarias
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nascemos da paixão por conectar pessoas aos melhores estabelecimentos da sua região, 
            oferecendo praticidade para clientes e ferramentas poderosas para comerciantes.
          </p>
        </div>

        {/* Nossa Missão */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Nossa Missão</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Democratizar o acesso à tecnologia para adegas e tabacarias, permitindo que pequenos 
            e médios comerciantes tenham as mesmas ferramentas de gestão e alcance de grandes 
            redes, enquanto oferecemos aos consumidores a melhor experiência de descoberta e 
            compra da região.
          </p>
        </section>

        {/* Nossos Valores */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Nossos Valores</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Paixão pelo Cliente</h3>
                <p className="text-muted-foreground">
                  Cada decisão que tomamos considera o impacto na experiência de nossos 
                  usuários e parceiros comerciais.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Comunidade</h3>
                <p className="text-muted-foreground">
                  Acreditamos no poder da comunidade local e trabalhamos para fortalecer 
                  os laços entre comerciantes e consumidores.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Inovação</h3>
                <p className="text-muted-foreground">
                  Estamos sempre buscando novas formas de melhorar nossa plataforma e 
                  oferecer as melhores soluções do mercado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Award className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Excelência</h3>
                <p className="text-muted-foreground">
                  Buscamos a excelência em tudo que fazemos, desde o atendimento ao cliente 
                  até o desenvolvimento de novas funcionalidades.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* O que Oferecemos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">O que Oferecemos</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Para Consumidores</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Descubra as melhores adegas e tabacarias da sua região</li>
                <li>Visualize cardápios completos com fotos e preços</li>
                <li>Faça pedidos para entrega ou consumo no local</li>
                <li>Avalie e favorite seus estabelecimentos preferidos</li>
                <li>Acompanhe seus pedidos em tempo real</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Para Comerciantes</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Sistema completo de gestão de pedidos e mesas</li>
                <li>Controle de estoque e alertas automáticos</li>
                <li>Gestão financeira com relatórios detalhados</li>
                <li>Cardápio digital personalizável</li>
                <li>Sistema de delivery integrado</li>
                <li>Rankings e visibilidade para atrair novos clientes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Localização */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Onde Estamos</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Atualmente, a Mobdega atende a região metropolitana de São Paulo, incluindo a capital 
            e cidades vizinhas como Guarulhos, ABCD Paulista, Osasco e região. Estamos em constante 
            expansão para levar nossa plataforma a mais regiões do Brasil.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center bg-primary/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Faça Parte da Mobdega</h2>
          <p className="text-muted-foreground mb-6">
            Seja como cliente descobrindo novos estabelecimentos ou como comerciante 
            expandindo seu negócio, estamos aqui para ajudar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate('/')}>
              Explorar Comércios
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Seja um Parceiro
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SobreNos;



## Progresso de Treinamento: Marcar videos como concluidos

### O que sera feito

Adicionar caixas de selecao (checkboxes) em cada card de video na tela de Treinamento do comercio, permitindo:
- Marcar manualmente como concluido ao clicar na checkbox
- Marcar automaticamente quando um video direto (.mp4) atingir 98% de reproducao
- Persistir o progresso no banco de dados por usuario

**Nota sobre YouTube:** Videos do YouTube reproduzidos via iframe nao permitem rastrear o progresso de reproducao por restricoes de seguranca do navegador. Para esses, o usuario podera marcar manualmente pela checkbox.

---

### Detalhes tecnicos

**1. Nova tabela no banco de dados: `training_video_progress`**

```sql
CREATE TABLE public.training_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.training_videos(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.training_video_progress ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver e gerenciar seu proprio progresso
CREATE POLICY "Users can manage their own progress"
  ON public.training_video_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Master Admin pode ver todo o progresso
CREATE POLICY "Master admin can view all progress"
  ON public.training_video_progress
  FOR SELECT
  USING (is_master_admin());
```

**2. Alteracoes no componente `CommerceTraining.tsx`**

- Buscar o progresso do usuario logado ao carregar os videos
- Exibir checkbox no canto superior esquerdo de cada card de video
- Ao clicar na checkbox: inserir/atualizar registro na tabela `training_video_progress`
- Para videos diretos (.mp4/.webm): monitorar o evento `timeupdate` do elemento `<video>` e marcar automaticamente ao atingir 98%
- Exibir indicador visual (icone de check verde + opacidade reduzida) nos videos ja concluidos
- Adicionar barra de progresso geral no topo: "X de Y videos concluidos"

**3. Estrutura visual dos cards**

- Checkbox posicionada no canto superior esquerdo do thumbnail (sobre a imagem)
- Videos concluidos: overlay sutil verde com icone de check
- Barra de progresso no cabecalho da pagina mostrando porcentagem total

**Arquivos a criar/alterar:**
- 1 migracao SQL (nova tabela + politicas RLS)
- `src/components/commerce/CommerceTraining.tsx` (logica de progresso, checkboxes, auto-complete, barra de progresso)


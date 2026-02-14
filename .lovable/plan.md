

## Correção: Vídeos de Treinamento invisíveis para comércios pendentes

### Problema

A política de segurança (RLS) da tabela `training_videos` só permite visualização para comércios com status `approved`:

```sql
commerces.status = 'approved'
```

Isso contradiz o propósito da tela de Treinamento, que foi projetada justamente para ser acessível enquanto o comércio aguarda aprovação (status `pending`).

### Solução

Atualizar a política RLS para permitir que comércios com status `pending` **também** vejam os vídeos ativos.

### Alteração

**Migração SQL** - Recriar a política com a condição expandida:

```sql
DROP POLICY IF EXISTS "Commerce owners can view active training videos" 
  ON public.training_videos;

CREATE POLICY "Commerce owners can view active training videos" 
  ON public.training_videos 
  FOR SELECT 
  USING (
    is_active = true AND (
      is_master_admin() OR 
      EXISTS (
        SELECT 1 FROM commerces 
        WHERE commerces.owner_id = auth.uid() 
        AND commerces.status IN ('approved', 'pending')
      )
    )
  );
```

### Resultado

- Comércios **pendentes**: veem os vídeos de treinamento (comportamento esperado)
- Comércios **aprovados**: continuam vendo normalmente
- Comércios **rejeitados/suspensos**: continuam sem acesso
- Master Admin: acesso total mantido

1 migração SQL, nenhum arquivo de código alterado.


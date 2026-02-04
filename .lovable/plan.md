
# Plano: Corrigir Erro de Enum invoice_type

## Problema Identificado

Ao tentar criar uma nova fatura, o sistema mostra o erro:
> `invalid input value for enum invoice_type: "monthly"`

O enum `invoice_type` no banco de dados só aceita os valores:
- `"payable"` (a pagar)
- `"receivable"` (a receber)

O valor `"monthly"` não existe neste enum.

---

## Causa do Erro

A função `notify_commerce_on_new_invoice()` no banco de dados foi criada com referências a valores antigos (`'monthly'` e `'tax'`) que não existem no enum atual. Essa função é um trigger que dispara após cada inserção na tabela `invoices`.

**Código atual da função:**
```sql
CASE 
    WHEN NEW.type = 'monthly' THEN 'mensalidade'  -- ERRADO: 'monthly' não existe
    WHEN NEW.type = 'tax' THEN 'imposto'          -- ERRADO: 'tax' não existe
    ELSE 'cobrança'
END
```

---

## Solução

### Atualizar a Função no Banco de Dados

Corrigir a função `notify_commerce_on_new_invoice()` para usar os valores corretos do enum:

```sql
CREATE OR REPLACE FUNCTION public.notify_commerce_on_new_invoice()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.commerce_notifications (
        commerce_id,
        type,
        title,
        message,
        invoice_id
    ) VALUES (
        NEW.commerce_id,
        'new_invoice',
        'Nova Fatura Disponível',
        'Uma nova fatura de ' || 
        CASE 
            WHEN NEW.type = 'receivable' THEN 'mensalidade'
            WHEN NEW.type = 'payable' THEN 'despesa'
            ELSE 'cobrança'
        END || 
        ' no valor de R$ ' || 
        TRIM(TO_CHAR(NEW.amount, 'FM999G999D00')) || 
        ' foi gerada para o mês de ' || NEW.reference_month || '.',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Observação sobre Cache do Navegador

Se após esta correção o erro persistir, pode ser necessário limpar o cache do navegador ou fazer um hard refresh (Ctrl+Shift+R) para garantir que o código mais recente do frontend está sendo executado.

---

## Resultado Esperado

Após a atualização:
- Faturas poderão ser criadas sem erros
- As notificações para comércios serão geradas corretamente
- O texto da notificação usará "mensalidade" para tipo `receivable` e "despesa" para tipo `payable`

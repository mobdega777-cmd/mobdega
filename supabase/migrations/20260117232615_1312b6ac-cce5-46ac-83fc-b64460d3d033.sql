-- Adicionar campos para foto de capa, status aberto/fechado, horário de funcionamento e WhatsApp
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "22:00", "enabled": true}, "tuesday": {"open": "08:00", "close": "22:00", "enabled": true}, "wednesday": {"open": "08:00", "close": "22:00", "enabled": true}, "thursday": {"open": "08:00", "close": "22:00", "enabled": true}, "friday": {"open": "08:00", "close": "22:00", "enabled": true}, "saturday": {"open": "08:00", "close": "22:00", "enabled": true}, "sunday": {"open": "08:00", "close": "22:00", "enabled": false}}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;
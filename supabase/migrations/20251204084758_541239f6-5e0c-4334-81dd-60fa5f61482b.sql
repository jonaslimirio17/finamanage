-- Add recurrence column to debts table
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS recurrence text DEFAULT NULL;

-- Add comment to explain recurrence values
COMMENT ON COLUMN public.debts.recurrence IS 'Recurrence type: monthly, weekly, yearly, or null for one-time debts';
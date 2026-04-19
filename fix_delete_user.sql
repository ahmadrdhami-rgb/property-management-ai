-- Yeh code chalane se aap aram se "Authentication" menu se user delete kar payenge,
-- Aur unka sara data automatically delete ho jayega (Database error fix)

-- 1. Tenants table ko CASCADE delete allow karo
ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_id_fkey;

ALTER TABLE public.tenants
ADD CONSTRAINT tenants_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Baki tables (payments, documents) ko tenants table se CASCADE attach karo
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;

ALTER TABLE public.payments
ADD CONSTRAINT payments_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_tenant_id_fkey;

ALTER TABLE public.documents
ADD CONSTRAINT documents_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_requests
DROP CONSTRAINT IF EXISTS maintenance_requests_tenant_id_fkey;

ALTER TABLE public.maintenance_requests
ADD CONSTRAINT maintenance_requests_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.disputes
DROP CONSTRAINT IF EXISTS disputes_tenant_id_fkey;

ALTER TABLE public.disputes
ADD CONSTRAINT disputes_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.enquiries
DROP CONSTRAINT IF EXISTS enquiries_tenant_id_fkey;

ALTER TABLE public.enquiries
ADD CONSTRAINT enquiries_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- STEP 1: OLD POLICIES REMOVE
DROP POLICY IF EXISTS "Allow all" ON tenants;
DROP POLICY IF EXISTS "Allow all" ON payments;
DROP POLICY IF EXISTS "Allow all" ON documents;
DROP POLICY IF EXISTS "Allow all" ON maintenance_requests;
DROP POLICY IF EXISTS "Allow all" ON disputes;

-- STEP 2: PERMANENT (SECURE MULTI-TENANT FIX)

-- Tenants table
CREATE POLICY "Tenant can view own data"
ON tenants
FOR SELECT
USING (auth.uid() = id);

-- Payments table
CREATE POLICY "Tenant payments access"
ON payments
FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Insert payments"
ON payments
FOR INSERT
WITH CHECK (auth.uid() = tenant_id);

-- Documents table
CREATE POLICY "Tenant documents access"
ON documents
FOR SELECT
USING (auth.uid() = tenant_id);

-- Maintenance Requests table (Corrected table name)
CREATE POLICY "Tenant requests access"
ON maintenance_requests
FOR ALL
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

-- Disputes table
CREATE POLICY "Tenant disputes access"
ON disputes
FOR ALL
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

-- Optional Admin Access (uncomment if needed):
-- USING (auth.uid() = tenant_id OR auth.role() = 'service_role')

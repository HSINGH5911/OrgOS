-- ==============================================================================                                                                                                                         
-- Migration: 002_auth_trigger.sql                                                                                                                                                                        
-- Description: Trigger to auto-create profile and provision org on user signup                                                                                                                           
-- ==============================================================================   

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_name TEXT;
    org_name TEXT;
    org_university TEXT;
    org_slug TEXT;
    is_new_org BOOLEAN;
    new_ord_id UUID;
    existing_org_id UUID;
BEGIN
    -- 1. Extract metadata passed from frontend signUp()                                                                                                                                                  
        user_name := COALESCE(                                                                                                                                                                                
            NEW.raw_user_meta_data->>'full_name',                                                                                                                                                             
            split_part(NEW.email, '@', 1)                                                                                                                                                                     
        );                                                                                                                                                                                                    
        org_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'organization'), '');                                                                                                                                
        org_university := COALESCE(NEW.raw_user_meta_data->>'university', 'Campus');                                                                                                                          
        is_new_org := COALESCE((NEW.raw_user_meta_data->>'is_new_org')::boolean, false);                                                                                                                      
                                                                                                                                                                                                              
        -- 2. Create the public.profiles record                                                                                                                                                               
        INSERT INTO public.profiles (id, full_name, email, avatar_url)                                                                                                                                        
        VALUES (                                                                                                                                                                                              
            NEW.id,                                                                                                                                                                                           
            user_name,                                                                                                                                                                                        
            NEW.email,                                                                                                                                                                                        
            NEW.raw_user_meta_data->>'avatar_url'                                                                                                                                                             
        )                                                                                                                                                                                                     
        ON CONFLICT (id) DO UPDATE SET                                                                                                                                                                        
            full_name = EXCLUDED.full_name,                                                                                                                                                                   
            email = EXCLUDED.email;                                                                                                                                                                           
                                                                                                                                                                                                              
        -- 3. Case A: Registering a BRAND NEW organization                                                                                                                                                    
        IF is_new_org IS TRUE AND org_name IS NOT NULL THEN                                                                                                                                                   
            -- Generate URL slug (e.g. "Robotics Club" -> "robotics-club-a1b2")                                                                                                                               
            org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));                                                                                                                           
            org_slug := trim(both '-' from org_slug) || '-' || substr(md5(random()::text), 1, 4);                                                                                                             
                                                                                                                                                                                                              
            -- Insert the organization                                                                                                                                                                        
            INSERT INTO public.organizations (name, slug, university)                                                                                                                                         
            VALUES (org_name, org_slug, org_university)                                                                                                                                                       
            RETURNING id INTO new_org_id;                                                                                                                                                                     
                                                                                                                                                                                                              
            -- Assign the user as President                                                                                                                                                                   
            INSERT INTO public.org_memberships (org_id, user_id, role, title, is_active)                                                                                                                      
            VALUES (new_org_id, NEW.id, 'president', 'President', true);                                                                                                                                      
                                                                                                                                                                                                              
        -- 4. Case B: Joining an EXISTING organization by name (if it exists)                                                                                                                                 
        ELSIF org_name IS NOT NULL THEN                                                                                                                                                                       
            SELECT id INTO existing_org_id                                                                                                                                                                    
            FROM public.organizations                                                                                                                                                                         
            WHERE lower(name) = lower(org_name)                                                                                                                                                               
            LIMIT 1;                                                                                                                                                                                          
                                                                                                                                                                                                              
            IF existing_org_id IS NOT NULL THEN                                                                                                                                                               
                INSERT INTO public.org_memberships (org_id, user_id, role, title, is_active)                                                                                                                  
                VALUES (existing_org_id, NEW.id, 'member', 'Member', true)                                                                                                                                    
                ON CONFLICT (org_id, user_id) DO NOTHING;                                                                                                                                                     
            END IF;                                                                                                                                                                                           
        END IF;                                                                                                                                                                                               
                                                                                                                                                                                                              
        RETURN NEW;                                                                                                                                                                                           
    END;                                                                                                                                                                                                      
    $$;                                                                                                                                                                                                       
                                                                                                                                                                                                              
    -- Drop old trigger if it exists, then bind to auth.users                                                                                                                                                 
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;                                                                                                                                                
                                                                                                                                                                                                              
    CREATE TRIGGER on_auth_user_created                                                                                                                                                                       
        AFTER INSERT ON auth.users                                                                                                                                                                            
        FOR EACH ROW                                                                                                                                                                                          
        EXECUTE FUNCTION public.handle_new_user();
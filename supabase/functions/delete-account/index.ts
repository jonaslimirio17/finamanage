import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth token for verification
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing account deletion request for user: ${user.id}`);

    // Get password from request body
    const { password, reason } = await req.json();

    if (!password) {
      console.error('Missing password in request');
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (signInError) {
      console.error('Password verification failed:', signInError);
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Password verified successfully');

    // Log the deletion request
    const { error: logError } = await supabaseClient
      .from('account_deletion_logs')
      .insert({
        profile_id: user.id,
        email: user.email,
        reason: reason || null
      });

    if (logError) {
      console.error('Failed to log deletion:', logError);
    }

    // Delete profile (this will cascade to other tables based on foreign keys)
    const { error: deleteProfileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (deleteProfileError) {
      console.error('Failed to delete profile:', deleteProfileError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Delete the auth user (this will cascade delete the profile and related data)
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in delete-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

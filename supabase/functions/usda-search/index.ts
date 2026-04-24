import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// CORS headers so your React Native app is allowed to talk to it
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async(req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    //Get the query from the above req param
    const { query, pageNumber = 1, pageSize = 15 } = await req.json()

    // Grab the USDA key 
    const USDA_KEY = Deno.env.get('USDA_API_KEY')

    if (!USDA_KEY){
      throw new Error("USDA API Key missing on Supabase secrets")
    } 

    // Fetch data from USDA
    const response = await fetch(
      `${BASE_URL}/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(query || '')}&pageSize=${pageSize}&pageNumber=${pageNumber}&dataType=Branded,Foundation`
    )
    
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

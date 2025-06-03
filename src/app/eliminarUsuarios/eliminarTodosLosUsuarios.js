// eliminarTodosLosUsuarios.js
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://toodpallyyueukyxfkju.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvb2RwYWxseXl1ZXVreXhma2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIxNjY5OCwiZXhwIjoyMDU5NzkyNjk4fQ.L3zn_T2Ue5mw2yHyC3sn1rA-vjCGvzlH8SXJ19eWa-s';

const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function eliminarTodosLosUsuarios() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error('❌ Error al obtener usuarios:', error.message);
    return;
  }

  const users = data?.users || [];

  if (users.length === 0) {
    console.log('⚠️ No hay usuarios para eliminar.');
    return;
  }

  const userIds = users.map(u => u.id);

  // Eliminar de tu tabla personalizada
  const { error: tablaError } = await supabase
    .from('usuarios')
    .delete()
    .in('id', userIds);

  if (tablaError) {
    console.error('❌ Error al eliminar de la tabla usuarios:', tablaError.message);
    return;
  }

  // Eliminar de autenticación (uno por uno)
  for (const id of userIds) {
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error(`❌ Error al eliminar usuario ${id}:`, authError.message);
    } else {
      console.log(`✅ Usuario ${id} eliminado`);
    }
  }

  console.log('🎉 Todos los usuarios han sido eliminados.');
}

eliminarTodosLosUsuarios();

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://toodpallyyueukyxfkju.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvb2RwYWxseXl1ZXVreXhma2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIxNjY5OCwiZXhwIjoyMDU5NzkyNjk4fQ.L3zn_T2Ue5mw2yHyC3sn1rA-vjCGvzlH8SXJ19eWa-s'
);

async function setUserRole(userId: string, role: string) {
  // 1️⃣ Actualizar metadata del usuario (Auth)
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role }
  });

  if (error) {
    console.error('❌ Error actualizando user_metadata:', error.message);
    return;
  }

  console.log('✅ Rol actualizado en Auth:', data.user.user_metadata.role);

  // 2️⃣ Actualizar tabla personalizada "usuarios"
  const { error: updateError } = await supabaseAdmin
    .from('usuarios')
    .update({ role: role }) // o "role", según el nombre exacto de tu columna
    .eq('id', userId); // asegúrate que esta columna es la clave primaria

  if (updateError) {
    console.error('❌ Error actualizando tabla usuarios:', updateError.message);
    return;
  }

  console.log('✅ Rol actualizado también en la tabla usuarios');
}

setUserRole('ab9829a4-baf5-456e-ae7d-f31a44dabddc', 'admin');


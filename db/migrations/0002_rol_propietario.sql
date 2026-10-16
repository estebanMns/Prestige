-- Rol PROPIETARIO: único rol que puede cambiar los datos de contacto de la tienda (WhatsApp, correo, dirección).
-- ADMIN conserva el resto de permisos, pero ya no puede cambiar esos datos.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PROPIETARIO';

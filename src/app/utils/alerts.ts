import Swal from 'sweetalert2';

export const confirmar = async (mensaje: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: mensaje,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#ef4444'
  });
  return result.isConfirmed;
};

export const mostrarAlerta = (mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  return Swal.fire({
    text: mensaje,
    icon: tipo,
    confirmButtonColor: '#0ea5e9'
  });
};

import { NotificacionPWAColaborador, TipoNotificacionPWA } from '../types';

const STORAGE_KEY = 'cimiento_pwa_notificaciones_v1';
const PERMISSION_PROMPTED_KEY = 'cimiento_pwa_push_prompted';

/**
 * Generador simple de identificadores únicos
 */
function uid(): string {
  return 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/**
 * Semillas iniciales demostrativas para que el colaborador o revisor
 * vea de inmediato desprendibles de nómina y manuales de funciones en su buzón
 */
const NOTIFICACIONES_INICIALES: NotificacionPWAColaborador[] = [
  {
    id: 'pwa-notif-001',
    tipo: 'nomina_desprendible',
    titulo: 'Nuevo Desprendible de Nómina Disponible',
    mensaje: 'Se ha liquidado y publicado su comprobante de nómina correspondiente a la 2da Quincena de Octubre de 2026. Consulte el detalle de devengados y deducciones de ley.',
    fechaCreacion: new Date(Date.now() - 3600000 * 4).toISOString(),
    leido: false,
    canal: 'push_pwa',
    estadoEnvioPush: 'entregado',
    enlaceAccion: '/nomina',
    periodoNomina: '2026-10 (2da Quincena)'
  },
  {
    id: 'pwa-notif-002',
    tipo: 'manual_funciones',
    titulo: 'Actualización en su Manual de Funciones y Responsabilidades',
    mensaje: 'La Dirección de Gestión Humana ha actualizado el perfil de competencias, responsabilidades SG-SST y requisitos para su cargo: "Técnico de Instalaciones y Fibra Óptica".',
    fechaCreacion: new Date(Date.now() - 3600000 * 26).toISOString(),
    leido: false,
    canal: 'push_pwa',
    estadoEnvioPush: 'entregado',
    enlaceAccion: '/cargos',
    cargoId: 'c7',
    cargoNombre: 'Técnico de Instalaciones y Fibra Óptica',
    versionManual: 'V.2026.2'
  }
];

class PWANotificationService {
  /**
   * Verifica si el navegador soporta Notification API y Service Worker
   */
  public estaSoportado(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Retorna el estado actual del permiso en el dispositivo ('default' | 'granted' | 'denied')
   */
  public obtenerEstadoPermiso(): NotificationPermission {
    if (!this.estaSoportado()) return 'denied';
    return Notification.permission;
  }

  /**
   * Solicita al usuario autorización en el navegador para enviar notificaciones Push
   */
  public async solicitarPermiso(): Promise<NotificationPermission> {
    if (!this.estaSoportado()) {
      return 'denied';
    }

    try {
      localStorage.setItem(PERMISSION_PROMPTED_KEY, 'true');
      const resultado = await Notification.requestPermission();
      
      if (resultado === 'granted') {
        // Disparar una notificación de bienvenida demostrativa para confirmar activación
        await this.despacharNotificacionLocal({
          titulo: 'Notificaciones B Group Activas',
          cuerpo: 'Recibirá alertas push inmediatas al publicarse nuevos desprendibles y cambios en su manual de funciones.',
          url: '/'
        });
      }

      this.emitirEventoCambio();
      return resultado;
    } catch (err) {
      console.warn('Error al solicitar permiso de notificaciones push:', err);
      return 'denied';
    }
  }

  /**
   * Emite una notificación push local en el dispositivo del usuario
   * utilizando el Service Worker (si está listo) o la Notification API de ventana
   */
  public async despacharNotificacionLocal(params: {
    titulo: string;
    cuerpo: string;
    tag?: string;
    url?: string;
    icono?: string;
    datosAdicionales?: any;
  }): Promise<boolean> {
    if (!this.estaSoportado()) return false;
    if (Notification.permission !== 'granted') return false;

    const iconoFinal = params.icono || '/pwa-192x192.png';
    const opciones: NotificationOptions = {
      body: params.cuerpo,
      icon: iconoFinal,
      badge: '/pwa-192x192.png',
      tag: params.tag || 'bg-gh-' + Date.now(),
      data: {
        url: params.url || '/',
        ...(params.datosAdicionales || {})
      }
    };

    try {
      // 1. Intentar mediante el Service Worker registrado
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(params.titulo, opciones);
          return true;
        }
      }

      // 2. Fallback mediante constructor estándar de Notification
      const notif = new Notification(params.titulo, opciones);
      notif.onclick = () => {
        window.focus();
        if (params.url && window.location.pathname !== params.url) {
          window.location.href = params.url;
        }
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('No fue posible disparar la notificación push nativa en este contexto:', err);
      return false;
    }
  }

  /**
   * Obtiene todas las notificaciones almacenadas en el buzón PWA
   */
  public obtenerNotificaciones(empleadoId?: string): NotificacionPWAColaborador[] {
    if (typeof window === 'undefined') return NOTIFICACIONES_INICIALES;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(NOTIFICACIONES_INICIALES));
        return NOTIFICACIONES_INICIALES;
      }
      const lista: NotificacionPWAColaborador[] = JSON.parse(data);

      if (!empleadoId) {
        return lista;
      }

      // Filtrar notificaciones para este colaborador o difusiones generales
      return lista.filter(n => !n.empleadoId || n.empleadoId === 'todos' || n.empleadoId === empleadoId);
    } catch (e) {
      console.error('Error al leer notificaciones PWA de localStorage:', e);
      return NOTIFICACIONES_INICIALES;
    }
  }

  /**
   * Retorna el número de notificaciones no leídas para el colaborador
   */
  public contarNoLeidas(empleadoId?: string): number {
    const lista = this.obtenerNotificaciones(empleadoId);
    return lista.filter(n => !n.leido).length;
  }

  /**
   * Registra una nueva notificación en el buzón y opcionalmente dispara la alerta Push nativa
   */
  public async registrarNotificacion(params: {
    tipo: TipoNotificacionPWA;
    titulo: string;
    mensaje: string;
    empleadoId?: string;
    empleadoNombre?: string;
    documentoEmpleado?: string;
    cargoId?: string;
    cargoNombre?: string;
    enlaceAccion?: string;
    periodoNomina?: string;
    versionManual?: string;
    dispararPush?: boolean;
    metadatos?: Record<string, any>;
  }): Promise<NotificacionPWAColaborador> {
    const lista = this.obtenerNotificaciones();

    let pushExitoso = false;
    if (params.dispararPush !== false && this.obtenerEstadoPermiso() === 'granted') {
      pushExitoso = await this.despacharNotificacionLocal({
        titulo: params.titulo,
        cuerpo: params.mensaje,
        url: params.enlaceAccion || '/',
        tag: params.tipo + '_' + (params.empleadoId || 'general')
      });
    }

    const nueva: NotificacionPWAColaborador = {
      id: uid(),
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      fechaCreacion: new Date().toISOString(),
      leido: false,
      canal: 'push_pwa',
      estadoEnvioPush: pushExitoso ? 'entregado' : 'pendiente',
      empleadoId: params.empleadoId,
      empleadoNombre: params.empleadoNombre,
      documentoEmpleado: params.documentoEmpleado,
      cargoId: params.cargoId,
      cargoNombre: params.cargoNombre,
      enlaceAccion: params.enlaceAccion,
      periodoNomina: params.periodoNomina,
      versionManual: params.versionManual,
      metadatos: params.metadatos
    };

    const actualizada = [nueva, ...lista];
    this.guardarNotificaciones(actualizada);
    this.emitirEventoCambio();

    return nueva;
  }

  /**
   * Disparador Masivo / Individual: Notificar publicación de nuevos desprendibles de nómina
   */
  public async notificarPublicacionDesprendiblesNomina(params: {
    periodo: string; // ej: "Octubre 2026 - 2da Quincena"
    colaboradores: { id: string; nombre: string; documento?: string; valorNeto?: number }[];
    empresaNombre?: string;
  }): Promise<{ enviadas: number }> {
    const nombreOrg = params.empresaNombre || 'B GROUP INGENIERIA S.A.S.';
    const total = params.colaboradores.length;

    // Disparar alerta push nativa en el dispositivo si el usuario actual es uno de los colaboradores o si es prueba
    await this.despacharNotificacionLocal({
      titulo: `💰 Nuevo Desprendible de Nómina (${params.periodo})`,
      cuerpo: `Su comprobante oficial de pago de nómina ha sido publicado por ${nombreOrg}. Ingrese para consultar y descargar el soporte legal.`,
      url: '/nomina',
      tag: 'nomina_' + params.periodo.replace(/\s+/g, '_')
    });

    // Guardar en el buzón institucional
    for (const col of params.colaboradores) {
      await this.registrarNotificacion({
        tipo: 'nomina_desprendible',
        titulo: `Desprendible de Nómina Publicado — ${params.periodo}`,
        mensaje: `Estimado(a) ${col.nombre}: Se encuentra disponible para consulta y descarga su volante de pago de nómina correspondiente a ${params.periodo}${col.valorNeto ? ` por valor neto de $${col.valorNeto.toLocaleString('es-CO')}` : ''}.`,
        empleadoId: col.id,
        empleadoNombre: col.nombre,
        documentoEmpleado: col.documento,
        enlaceAccion: '/nomina',
        periodoNomina: params.periodo,
        dispararPush: false // ya disparado centralmente arriba
      });
    }

    return { enviadas: total };
  }

  /**
   * Disparador: Notificar actualización en el manual de funciones y responsabilidades
   */
  public async notificarActualizacionManualFunciones(params: {
    cargoId: string;
    cargoNombre: string;
    version?: string;
    resumenCambios?: string;
    colaboradoresAfectados?: { id: string; nombre: string; documento?: string }[];
    empresaNombre?: string;
  }): Promise<{ enviadas: number }> {
    const nombreOrg = params.empresaNombre || 'B GROUP INGENIERIA S.A.S.';
    const versionStr = params.version || new Date().getFullYear() + '.1';
    const colaboradores = params.colaboradoresAfectados || [];

    // Disparar push nativo
    await this.despacharNotificacionLocal({
      titulo: `📋 Actualización en Manual de Funciones: ${params.cargoNombre}`,
      cuerpo: `Gestión Humana ha publicado una actualización de su descriptor de cargo y responsabilidades SST (${versionStr}).`,
      url: '/cargos',
      tag: 'cargo_' + params.cargoId
    });

    // Guardar registros en buzón
    if (colaboradores.length > 0) {
      for (const col of colaboradores) {
        await this.registrarNotificacion({
          tipo: 'manual_funciones',
          titulo: `Actualización de Manual de Funciones (${versionStr})`,
          mensaje: `Hola ${col.nombre}: Se ha emitido una nueva versión del Manual de Funciones y Perfil de Competencias para su cargo "${params.cargoNombre}". ${params.resumenCambios ? `Novedades: ${params.resumenCambios}` : 'Consulte las funciones actualizadas y lineamientos SG-SST.'}`,
          empleadoId: col.id,
          empleadoNombre: col.nombre,
          documentoEmpleado: col.documento,
          cargoId: params.cargoId,
          cargoNombre: params.cargoNombre,
          enlaceAccion: '/cargos',
          versionManual: versionStr,
          dispararPush: false
        });
      }
    } else {
      // Registro general por cargo
      await this.registrarNotificacion({
        tipo: 'manual_funciones',
        titulo: `Actualización en Manual de Funciones: ${params.cargoNombre}`,
        mensaje: `Se ha oficializado la versión ${versionStr} del manual de funciones y competencias para el cargo "${params.cargoNombre}". ${params.resumenCambios || ''}`,
        cargoId: params.cargoId,
        cargoNombre: params.cargoNombre,
        enlaceAccion: '/cargos',
        versionManual: versionStr,
        dispararPush: false
      });
    }

    return { enviadas: Math.max(1, colaboradores.length) };
  }

  /**
   * Marca una notificación específica como leída
   */
  public marcarComoLeida(id: string): void {
    const lista = this.obtenerNotificaciones();
    const actualizada = lista.map(n => (n.id === id ? { ...n, leido: true } : n));
    this.guardarNotificaciones(actualizada);
    this.emitirEventoCambio();
  }

  /**
   * Marca todas las notificaciones del colaborador como leídas
   */
  public marcarTodasComoLeidas(empleadoId?: string): void {
    const lista = this.obtenerNotificaciones();
    const actualizada = lista.map(n => {
      if (!empleadoId || !n.empleadoId || n.empleadoId === 'todos' || n.empleadoId === empleadoId) {
        return { ...n, leido: true };
      }
      return n;
    });
    this.guardarNotificaciones(actualizada);
    this.emitirEventoCambio();
  }

  /**
   * Elimina una notificación del buzón
   */
  public eliminarNotificacion(id: string): void {
    const lista = this.obtenerNotificaciones();
    const actualizada = lista.filter(n => n.id !== id);
    this.guardarNotificaciones(actualizada);
    this.emitirEventoCambio();
  }

  /**
   * Limpia todo el buzón
   */
  public reiniciarBuzon(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(NOTIFICACIONES_INICIALES));
      this.emitirEventoCambio();
    }
  }

  private guardarNotificaciones(lista: NotificacionPWAColaborador[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      } catch (e) {
        console.error('Error al persistir notificaciones en localStorage:', e);
      }
    }
  }

  private emitirEventoCambio(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa:notificaciones-actualizadas'));
    }
  }
}

export const pwaNotificationService = new PWANotificationService();

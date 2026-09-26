export const UI_TEXT = {
  metadata: {
    language: "es",
    title: "Op rebote en bolsa",
    description: "Oportunidades de rebote en bolsa para torpes y no tan torpes. Swing trading y gestión de universo de acciones.",
  },
  brand: "Op Rebote",
  navigation: {
    home: "Inicio",
    opportunities: "Oportunidades",
    companies: "Empresas radar",
    open: "Abrir navegación",
    close: "Cerrar navegación",
    expand: "Expandir navegación",
    collapse: "Encoger navegación",
    main: "Navegación principal",
  },
  pages: {
    opportunities: {
      title: "Oportunidades de rebote",
      description: "Empresas candidatas a oportunidades de rebote.",
    },
    companies: {
      title: "Empresas radar",
      description: "Empresas que se han detectado como candidatas para ser incluidas en el radar.",
    },
  },
  login: {
    heading: "Acceso Restringido",
    emailPlaceholder: "Correo electrónico",
    passwordPlaceholder: "Contraseña",
    submit: "Entrar",
  },
  buttons: {
    sync: "Actualizar radar",
    syncing: "Actualizando...",
    search: "Actualizar oportunidades",
    searching: "Buscando...",
  },
  loading: {
    sync: "Actualizando empresas para el radar...",
    search: "Buscando oportunidades...",
  },
  table: {
    titles: {
      TIER_0: "Dividend Kings en rebote",
      TIER_1: "Candidatas prioritarias de rebote",
      TOP: "Gran capitalización (TOP)",
      MID: "Capitalización media (MID)",
    },
    subtitles: {
      TIER_0: "Sobreventa y filtros de calidad superados",
    },
    columns: {
      ticker: "Ticker",
      name: "Nombre",
      price: "Precio",
      rsi: "RSI",
      volume: "Volumen",
      recentFloor: "Suelo reciente",
      type: "Tipo",
      sector: "Sector",
      marketCap: "Capitalización",
      dividend: "Dividendo",
    },
    values: {
      dividendYes: "Sí",
      dividendNo: "No",
      dividendKing: "Dividend King",
      dividendAristocrat: "Dividend Aristocrat",
      unknownSector: "Desconocido",
      notAvailable: "-",
      noData: "Sin datos",
    },
    formatting: {
      marketCapUnits: {
        trillion: "T",
        billion: "B",
        million: "M",
      },
    },
    pagination: {
      companyRecords: "empresas",
      opportunityRecords: "oportunidades",
      defaultRecords: "registros",
      pageSize: "Ver",
      previousPage: "Página anterior",
      nextPage: "Página siguiente",
      page: "Página",
      pageOf: "de",
      mobilePageSeparator: "/",
    },
    emptyStates: {
      default: "No hay registros para mostrar.",
      companies: "No hay empresas en esta categoría.",
      opportunities: "No hay oportunidades que cumplan el segundo filtro.",
    },
    sorting: {
      byColumn: (label: string) => `Ordenar por ${label.toLowerCase()}`,
    },
  },
  floor: {
    underMinimum: "bajo el mínimo",
    overMinimum: "sobre el mínimo",
    description: "Distancia entre el precio actual y el mínimo de las cinco velas previas. No es una estimación de caída máxima.",
  },
  feedback: {
    syncError: "Error al sincronizar con el mercado.",
    searchError: "Error al buscar oportunidades.",
    noYahooCompanies: "No se encontraron empresas en Yahoo.",
    syncDatabaseError: "Hubo un error al guardar en la base de datos.",
    searchFailure: "No se pudieron buscar nuevas oportunidades.",
    searchCompleted: (companyCount: number, opportunityCount: number) =>
      `Se analizaron ${companyCount} empresas del radar y se encontraron ${opportunityCount} rebotes.`,
    syncCompleted: (companyCount: number) =>
      `¡Sincronización completada! Se procesaron ${companyCount} empresas del mercado.`,
  },
} as const;
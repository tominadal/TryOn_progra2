import { API_URL } from "@/lib/api";

export const GITHUB_URL = "https://github.com/tominadal/TryOn_progra2";
const BLOB = `${GITHUB_URL}/blob/master`;

/** Swagger UI of the backend (same host as the REST API). */
export const API_DOCS_URL = `${API_URL.replace(/\/api\/v\d+\/?$/, "")}/docs`;

export interface DocEntry {
  id: string;
  title: string;
  description: string;
  href: string;
  group: "Producto y negocio" | "Ingeniería" | "Referencia";
}

/** Official project documentation (lives in the repository, `docs/` folder). */
export const DOCS: DocEntry[] = [
  {
    id: "resumen",
    title: "Resumen ejecutivo",
    description: "Propuesta de valor y creación de valor analizadas con Zero to One y Pattern Breakers.",
    href: `${BLOB}/docs/resumen_ejecutivo.md`,
    group: "Producto y negocio",
  },
  {
    id: "negocio",
    title: "Modelo de negocios y paso a producción",
    description: "Unit economics B2B2C, plan de producción en la nube y brechas para ser robusto.",
    href: `${BLOB}/docs/modelo_de_negocios.md`,
    group: "Producto y negocio",
  },
  {
    id: "requerimientos",
    title: "Requerimientos y casos de uso",
    description: "Requerimientos funcionales y no funcionales, endpoints REST, casos de uso e historias de usuario.",
    href: `${BLOB}/docs/requerimientos_casos_uso.md`,
    group: "Producto y negocio",
  },
  {
    id: "patrones",
    title: "Patrones de diseño y SOLID",
    description: "Strategy, Decorator, Observer, Factory Method y Repository, justificados en el código.",
    href: `${BLOB}/docs/patrones_solid.md`,
    group: "Ingeniería",
  },
  {
    id: "clases",
    title: "Diagramas de clases y de estado",
    description: "Dominio, patrones GoF, repositorios, estados de ProcessingJob y Order, y componentes.",
    href: `${BLOB}/docs/diagrama_clases.md`,
    group: "Ingeniería",
  },
  {
    id: "secuencia",
    title: "Diagramas de secuencia",
    description: "Alta y edición de prendas, probador 3D, Observer, Decorator, Factory y checkout.",
    href: `${BLOB}/docs/diagrama_secuencia.md`,
    group: "Ingeniería",
  },
  {
    id: "erd",
    title: "Diagrama entidad-relación",
    description: "Esquema relacional completo de la base de datos.",
    href: `${BLOB}/docs/diagrama_entidad_relacion.md`,
    group: "Ingeniería",
  },
  {
    id: "readme",
    title: "README del proyecto",
    description: "Arquitectura, instalación, ejecución local y con Docker.",
    href: `${BLOB}/README.md`,
    group: "Referencia",
  },
  {
    id: "changelog",
    title: "Changelog",
    description: "Novedades y cambios de cada versión.",
    href: `${BLOB}/CHANGELOG.md`,
    group: "Referencia",
  },
  {
    id: "api",
    title: "Referencia de la API (Swagger)",
    description: "Documentación interactiva de todos los endpoints. Requiere el backend en ejecución.",
    href: API_DOCS_URL,
    group: "Referencia",
  },
];

export interface Consigna {
  id: string;
  anchor: string;
  title: string;
  detail: string;
}

/** Course (Programación II) requirements and how the project fulfils each one. */
export const CONSIGNAS: Consigna[] = [
  {
    id: "1",
    anchor: "api",
    title: "Framework FastAPI (CRUD RESTful)",
    detail:
      "API modular con ciclo CRUD completo (GET, POST, PUT, PATCH, DELETE), inyección de dependencias y validación con Pydantic v2.",
  },
  {
    id: "2",
    anchor: "seguridad",
    title: "Autenticación y seguridad (RBAC)",
    detail:
      "OAuth2 con JWT stateless, contraseñas con bcrypt, control de roles y de propiedad (administrador, marca y cliente) y recuperación de contraseña con token de un solo uso.",
  },
  {
    id: "3",
    anchor: "datos",
    title: "SQLAlchemy ORM 2.0",
    detail:
      "Modelos relacionales con DeclarativeBase, migración automática de esquema y compatibilidad SQLite y PostgreSQL.",
  },
  {
    id: "4",
    anchor: "documentacion",
    title: "Documentación y casos de uso",
    detail:
      "Requerimientos formales, casos de uso, historias de usuario INVEST, plan de producción y Swagger UI.",
  },
  {
    id: "5",
    anchor: "deploy",
    title: "Contenedores Docker",
    detail: "Dockerfile de backend y frontend, .dockerignore y docker-compose para un despliegue reproducible.",
  },
  {
    id: "6",
    anchor: "testing",
    title: "Funciones de testing",
    detail: "Suite automatizada con pytest, tests parametrizados y TestClient, muy por encima del mínimo exigido.",
  },
  {
    id: "7",
    anchor: "testing",
    title: "CI/CD con GitHub Actions",
    detail: "Workflow que corre en cada push y pull request sobre backend y frontend.",
  },
  {
    id: "8",
    anchor: "patrones",
    title: "Patrones de diseño GoF y SOLID",
    detail: "Strategy, Decorator, Observer, Factory Method y Repository, más los cinco principios SOLID.",
  },
  {
    id: "9",
    anchor: "documentacion",
    title: "Presentación y defensa UML",
    detail: "Presentación interactiva y diagramas de clases, secuencia y entidad-relación.",
  },
  {
    id: "10",
    anchor: "deploy",
    title: "Deploy en la nube",
    detail: "Manifiesto render.yaml para el despliegue automatizado en Render.",
  },
];


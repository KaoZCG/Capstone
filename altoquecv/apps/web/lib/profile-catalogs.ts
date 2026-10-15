export const TECHNICAL_SKILL_CATEGORIES: Record<string, string[]> = {
  'Lenguajes y scripting': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'PHP',
    'Ruby', 'Kotlin', 'Swift', 'Dart', 'R', 'Scala', 'Bash', 'PowerShell', 'SQL', 'Solidity',
    'Elixir', 'Erlang', 'Clojure', 'Haskell', 'Lua', 'Perl', 'Objective-C', 'MATLAB', 'Julia', 'Groovy',
  ],
  'Frontend y diseño web': [
    'HTML5', 'CSS3', 'Sass', 'Less', 'React', 'Next.js', 'Vue.js', 'Nuxt', 'Angular', 'Svelte',
    'SvelteKit', 'Astro', 'Lit', 'Web Components', 'Redux', 'Zustand', 'TanStack Query', 'RxJS', 'Vite', 'Webpack',
    'Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI', 'shadcn/ui', 'Storybook', 'Responsive Design', 'Accesibilidad web', 'PWA', 'Web Performance',
  ],
  'Backend y APIs': [
    'Node.js', 'Express', 'NestJS', 'Fastify', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET Core', 'Laravel',
    'Symfony', 'Ruby on Rails', 'Phoenix', 'Gin', 'Fiber', 'REST APIs', 'GraphQL', 'gRPC', 'WebSockets', 'OpenAPI / Swagger',
    'Microservicios', 'Monolitos modulares', 'Autenticación OAuth 2.0', 'OpenID Connect', 'JWT', 'Serverless', 'Message queues', 'Webhooks', 'Prisma ORM', 'Entity Framework',
  ],
  'Aplicaciones móviles': [
    'React Native', 'Expo', 'Flutter', 'Android', 'Jetpack Compose', 'iOS', 'SwiftUI', 'Ionic', 'Capacitor', 'Xamarin',
    'Kotlin Multiplatform', 'Desarrollo móvil multiplataforma', 'Publicación en App Store', 'Publicación en Google Play', 'Diseño mobile-first',
  ],
  'Bases de datos y almacenamiento': [
    'PostgreSQL', 'MySQL', 'MariaDB', 'SQL Server', 'Oracle Database', 'SQLite', 'MongoDB', 'Redis', 'DynamoDB', 'Cassandra',
    'Elasticsearch', 'OpenSearch', 'Neo4j', 'Firebase Firestore', 'Supabase', 'Snowflake', 'BigQuery', 'Amazon Redshift', 'Databricks', 'Diseño de bases de datos',
    'Modelado de datos', 'Optimización SQL', 'Migraciones de datos', 'ETL', 'Data warehousing', 'Apache Kafka', 'RabbitMQ', 'Amazon SQS', 'Azure Service Bus', 'Apache Pulsar',
  ],
  'Cloud, DevOps y plataforma': [
    'AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Oracle Cloud', 'Cloudflare', 'Vercel', 'Netlify', 'Docker', 'Kubernetes', 'Helm',
    'Terraform', 'Pulumi', 'Ansible', 'OpenTofu', 'GitHub Actions', 'GitLab CI/CD', 'Jenkins', 'CircleCI', 'Argo CD', 'Flux CD',
    'Linux', 'Nginx', 'Apache HTTP Server', 'Serverless Framework', 'AWS Lambda', 'Azure Functions', 'Google Cloud Run', 'Prometheus', 'Grafana', 'OpenTelemetry',
    'Datadog', 'Sentry', 'CI/CD', 'Infraestructura como código', 'Gestión de secretos', 'Redes cloud', 'Alta disponibilidad', 'FinOps', 'Git', 'GitHub',
  ],
  'Datos, analítica e inteligencia artificial': [
    'Pandas', 'NumPy', 'Polars', 'Apache Spark', 'PySpark', 'Apache Airflow', 'dbt', 'Apache Flink', 'Jupyter', 'Looker',
    'Power BI', 'Tableau', 'Metabase', 'Qlik Sense', 'Excel avanzado', 'Estadística', 'Visualización de datos', 'Ingeniería de datos', 'Analítica de producto', 'Machine Learning',
    'Deep Learning', 'Procesamiento de lenguaje natural', 'Visión computacional', 'scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'XGBoost', 'Hugging Face', 'LLMs',
    'RAG', 'Embeddings y búsqueda vectorial', 'LangChain', 'LlamaIndex', 'MLOps', 'MLflow', 'Feature engineering', 'Evaluación de modelos', 'Prompt engineering', 'IA generativa',
  ],
  'Calidad, seguridad y pruebas': [
    'Jest', 'Vitest', 'React Testing Library', 'Cypress', 'Playwright', 'Selenium', 'Appium', 'Pytest', 'JUnit', 'Testing Library',
    'Pruebas unitarias', 'Pruebas de integración', 'Pruebas end-to-end', 'Pruebas de rendimiento', 'Pruebas de accesibilidad', 'QA automation', 'Postman', 'Insomnia', 'OWASP Top 10', 'Seguridad de aplicaciones',
    'Análisis estático', 'SonarQube', 'Snyk', 'Dependabot', 'Burp Suite', 'Gestión de vulnerabilidades', 'DevSecOps', 'Cifrado', 'Protección de datos', 'Threat modeling',
  ],
  'Arquitectura, producto y herramientas': [
    'Arquitectura de software', 'Domain-Driven Design', 'Event-driven architecture', 'Clean Architecture', 'Diseño de sistemas', 'UML', 'Figma', 'FigJam', 'Adobe XD', 'Jira',
    'Linear', 'Notion', 'Miro', 'Metodologías ágiles', 'Scrum', 'Kanban', 'Gestión de producto', 'Product discovery', 'A/B testing', 'SEO técnico',
    'Google Analytics 4', 'Tag Manager', 'Contentful', 'Strapi', 'Sanity CMS', 'WordPress', 'Shopify', 'Magento / Adobe Commerce', 'Salesforce', 'SAP',
  ],
};

export const PROFILE_KEYWORD_CATEGORIES: Record<string, string[]> = {
  'Arquitectura y desarrollo': [
    'Diseño de sistemas', 'Arquitectura escalable', 'Alta disponibilidad', 'Baja latencia', 'Microservicios', 'APIs REST', 'GraphQL', 'Integración de sistemas', 'Refactorización', 'Modernización de plataformas',
    'Desarrollo de producto', 'Desarrollo full stack', 'Desarrollo frontend', 'Desarrollo backend', 'Desarrollo móvil', 'Aplicaciones cloud-native', 'Sistemas distribuidos', 'Automatización de procesos', 'Revisión de código', 'Documentación técnica',
  ],
  'Cloud y operaciones': [
    'Migración a la nube', 'Optimización cloud', 'Infraestructura como código', 'Automatización CI/CD', 'Observabilidad', 'Monitoreo de servicios', 'Respuesta a incidentes', 'Continuidad operacional', 'Recuperación ante desastres', 'Optimización de costos',
    'Despliegues progresivos', 'Gestión de contenedores', 'Plataforma interna', 'SRE', 'DevOps', 'DevSecOps', 'Administración Linux', 'Gestión de redes', 'Escalamiento horizontal', 'Gestión de ambientes',
  ],
  'Datos e inteligencia artificial': [
    'Toma de decisiones basada en datos', 'Pipelines de datos', 'Procesamiento en tiempo real', 'Gobernanza de datos', 'Calidad de datos', 'Modelamiento predictivo', 'Analítica avanzada', 'Inteligencia de negocios', 'Machine learning aplicado', 'IA generativa',
    'Procesamiento de lenguaje natural', 'Búsqueda semántica', 'Sistemas de recomendación', 'Experimentación', 'Métricas de producto', 'Tableros ejecutivos', 'Data storytelling', 'MLOps', 'Evaluación de modelos', 'Privacidad de datos',
  ],
  'Calidad y seguridad': [
    'Calidad de software', 'Automatización de pruebas', 'Estrategia de testing', 'Pruebas de regresión', 'Pruebas de carga', 'Accesibilidad digital', 'Seguridad por diseño', 'Gestión de vulnerabilidades', 'Cumplimiento normativo', 'Protección de información',
    'Análisis de riesgos', 'Auditoría técnica', 'Respuesta a incidentes de seguridad', 'Ciclo de vida seguro', 'Prevención de fraude', 'Gestión de identidad', 'Control de acceso', 'Cifrado de datos', 'OWASP', 'Continuidad del negocio',
  ],
  'Producto y colaboración': [
    'Liderazgo técnico', 'Liderazgo de equipos', 'Mentoría', 'Colaboración interdisciplinaria', 'Comunicación con stakeholders', 'Gestión de proyectos', 'Metodologías ágiles', 'Scrum', 'Kanban', 'Priorización de roadmap',
    'Product discovery', 'Diseño centrado en usuarios', 'Investigación de usuarios', 'Prototipado', 'Experimentación A/B', 'Optimización de conversión', 'Mejora continua', 'Resolución de problemas', 'Pensamiento estratégico', 'Gestión del cambio',
  ],
  'Impacto y negocio': [
    'Reducción de costos', 'Optimización de procesos', 'Aumento de productividad', 'Escalabilidad del negocio', 'Transformación digital', 'Automatización empresarial', 'Experiencia de cliente', 'Retención de usuarios', 'Crecimiento de ingresos', 'Eficiencia operacional',
    'Innovación tecnológica', 'Time to market', 'Gestión de proveedores', 'Análisis de requerimientos', 'Alineamiento estratégico', 'Gestión de presupuesto', 'Indicadores KPI', 'OKR', 'Soporte a producción', 'Enfoque en resultados',
  ],
};

  # Plan V

  This is a code bundle for Plan V. The original project is available at https://www.figma.com/design/7VTASs2smFVuTG8ZSNo78R/Plan-V.

  ## Running the code

  ```bash
  npm install
  npm run dev
  ```

  Esto levanta el frontend (Vite) y el servidor API con IA en paralelo.

  ### Funcionalidades

  - **App paciente**: navegación Hoy / Mi plan / Mi camino / Mensajes. Registro de comidas por **foto o descripción** con macros automáticos (IA).
  - **CRM nutricionista**: copiloto con sugerencias (Up next, borrador de mensaje), revisión de comidas pendientes, confirmación.
  - **IA**: con `OPENAI_API_KEY` en `.env` usa GPT-4o-mini. Sin clave, modo demo con estimaciones simuladas.

  Copiá `.env.example` a `.env` y agregá tu clave de OpenAI para IA en vivo.

  
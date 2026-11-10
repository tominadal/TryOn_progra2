import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/PageShell";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Qué datos recopila TryOnHub, para qué los usa y cómo los protege.",
};

const SECTIONS: LegalSection[] = [
  {
    title: "Alcance",
    body: (
      <>
        <p>
          Esta política describe cómo TryOnHub trata los datos personales de quienes usan la plataforma, ya sea como
          cliente (prueba prendas sobre un avatar) o como marca (publica y administra su catálogo).
        </p>
        <p>
          TryOnHub es un proyecto académico de la cátedra de Programación II. No procesa pagos reales ni comercializa
          datos, y el tratamiento descripto aquí corresponde al funcionamiento actual de la aplicación.
        </p>
      </>
    ),
  },
  {
    title: "Datos que recopilamos",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>Cuenta:</strong> nombre completo, correo electrónico, tipo de cuenta (cliente o marca) y, para las
          marcas, el nombre comercial. La contraseña se guarda únicamente como hash (bcrypt), nunca en texto claro.
        </li>
        <li>
          <strong>Avatares:</strong> estatura, peso estimado, medidas corporales en centímetros y preferencias de
          apariencia (tono de piel, peinado, ropa y accesorios) que cargás para crear tus gemelos digitales.
        </li>
        <li>
          <strong>Compras:</strong> contenido del carrito y pedidos realizados, con talle, color y precio al momento de
          la compra.
        </li>
        <li>
          <strong>Catálogo (marcas):</strong> fotografías de prendas, medidas de moldería y metadatos que subís.
        </li>
        <li>
          <strong>Técnicos:</strong> un token de sesión guardado en tu navegador y registros del servidor necesarios
          para operar y depurar el servicio.
        </li>
      </ul>
    ),
  },
  {
    title: "Para qué usamos los datos",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Crear y mantener tu cuenta y autenticar tus sesiones.</li>
        <li>Mostrar cómo calza una prenda comparando sus medidas con las de tu avatar.</li>
        <li>Gestionar tu carrito, tus pedidos y el catálogo de cada marca.</li>
        <li>Generar el modelado 3D de las prendas a partir de las fotografías que suben las marcas.</li>
        <li>Mantener la seguridad del servicio y prevenir usos indebidos.</li>
      </ul>
    ),
  },
  {
    title: "Medidas corporales",
    body: (
      <p>
        Las medidas de tus avatares se usan solamente para calcular el calce dentro de la aplicación. No se muestran a
        las marcas ni a otros usuarios, y no se utilizan para publicidad ni para perfilado comercial.
      </p>
    ),
  },
  {
    title: "Servicios de terceros",
    body: (
      <p>
        Las fotografías de prendas que suben las marcas pueden enviarse a Google Gemini (visión por computadora) para
        extraer parámetros de modelado 3D. Las medidas y los datos personales de los clientes no se envían a ese
        servicio. La infraestructura de alojamiento puede estar provista por plataformas de nube como Render.
      </p>
    ),
  },
  {
    title: "Conservación y eliminación",
    body: (
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Podés eliminar tus avatares en cualquier momento desde
        la sección “Mis Gemelos Digitales” y pedir la baja de tu cuenta escribiéndonos por el canal indicado más abajo.
      </p>
    ),
  },
  {
    title: "Seguridad",
    body: (
      <p>
        Aplicamos contraseñas con hash, sesiones con tokens firmados de vencimiento acotado, control de acceso por rol y
        comunicaciones cifradas en los entornos desplegados. Ningún sistema es infalible: si detectáramos un incidente
        que afecte tus datos, te lo informaremos.
      </p>
    ),
  },
  {
    title: "Tus derechos",
    body: (
      <p>
        Conforme a la Ley 25.326 de Protección de Datos Personales de la República Argentina, podés acceder a tus
        datos, rectificarlos, actualizarlos o suprimirlos. La Agencia de Acceso a la Información Pública es el órgano
        de control de esta ley y atiende las denuncias y reclamos por incumplimientos.
      </p>
    ),
  },
  {
    title: "Contacto y cambios",
    body: (
      <>
        <p>
          Para consultas o para ejercer tus derechos, abrí una consulta en el{" "}
          <a
            href={`${GITHUB_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            repositorio del proyecto
          </a>
          .
        </p>
        <p>
          Podemos actualizar esta política; la fecha de arriba indica la última versión. Complementa los{" "}
          <Link href="/terminos" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Términos de Servicio
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <PageShell
      icon={ShieldCheck}
      title="Política de Privacidad"
      subtitle="Qué datos recopilamos, para qué los usamos y cómo los protegemos."
      widthClass="max-w-3xl"
    >
      <LegalDocument updated="10 de noviembre de 2026" sections={SECTIONS} />
    </PageShell>
  );
}


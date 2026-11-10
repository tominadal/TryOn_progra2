import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/PageShell";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Condiciones de uso de la plataforma TryOnHub para clientes y marcas.",
};

const SECTIONS: LegalSection[] = [
  {
    title: "Aceptación",
    body: (
      <p>
        Al crear una cuenta o usar TryOnHub aceptás estos términos. Si no estás de acuerdo, no uses la plataforma.
        TryOnHub es un proyecto académico de la cátedra de Programación II y se ofrece con fines demostrativos.
      </p>
    ),
  },
  {
    title: "El servicio",
    body: (
      <p>
        TryOnHub es una plataforma que conecta marcas de indumentaria con clientes. Las marcas publican prendas con su
        moldería en centímetros y la plataforma genera un modelado 3D; los clientes crean avatares con sus medidas y
        ven cómo calza cada prenda antes de comprar.
      </p>
    ),
  },
  {
    title: "Cuentas",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Debés proporcionar datos verdaderos y mantenerlos actualizados.</li>
        <li>Sos responsable de la confidencialidad de tu contraseña y de la actividad de tu cuenta.</li>
        <li>Existen dos tipos de cuenta, cliente y marca, con permisos distintos.</li>
        <li>Podemos suspender cuentas que incumplan estos términos o pongan en riesgo el servicio.</li>
      </ul>
    ),
  },
  {
    title: "Clientes: avatares y calce",
    body: (
      <>
        <p>
          La visualización 3D y el diagnóstico de calce son una estimación basada en las medidas que ingresás y en las
          medidas que declara la marca. Pueden diferir del calce real por la tela, el corte o la forma de tu cuerpo.
        </p>
        <p>
          Ingresá medidas propias o de personas a las que les comprás ropa, con su conocimiento cuando corresponda.
        </p>
      </>
    ),
  },
  {
    title: "Marcas: contenido y catálogo",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Sos responsable de la veracidad de los precios, las medidas de moldería, los talles y las descripciones que
          publicás.
        </li>
        <li>
          Declarás tener los derechos sobre las fotografías y los contenidos que subís, y nos autorizás a procesarlos
          para generar el modelado 3D y mostrarlos en la plataforma.
        </li>
        <li>No podés publicar contenido ilícito, engañoso o que infrinja derechos de terceros.</li>
      </ul>
    ),
  },
  {
    title: "Compras y pagos",
    body: (
      <p>
        En esta versión demostrativa el proceso de compra registra pedidos pero no realiza cobros reales. Los precios
        mostrados son los definidos por cada marca y se congelan al confirmar el pedido.
      </p>
    ),
  },
  {
    title: "Uso aceptable",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>No intentes acceder a cuentas o datos ajenos ni vulnerar la seguridad del servicio.</li>
        <li>No uses procesos automatizados que sobrecarguen la plataforma.</li>
        <li>No hagas ingeniería inversa sobre el servicio salvo en lo que la ley permita.</li>
      </ul>
    ),
  },
  {
    title: "Propiedad intelectual",
    body: (
      <p>
        El software, la marca TryOnHub y el diseño de la interfaz pertenecen a sus autores. Cada marca conserva la
        titularidad de sus prendas, fotografías y nombres comerciales.
      </p>
    ),
  },
  {
    title: "Limitación de responsabilidad",
    body: (
      <p>
        El servicio se ofrece “tal cual”, sin garantía de disponibilidad continua. En la medida permitida por la ley,
        los autores no responden por daños indirectos derivados del uso de la plataforma ni por diferencias entre el
        calce estimado y el real.
      </p>
    ),
  },
  {
    title: "Datos personales",
    body: (
      <p>
        El tratamiento de tus datos se rige por la{" "}
        <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Política de Privacidad
        </Link>
        .
      </p>
    ),
  },
  {
    title: "Cambios y ley aplicable",
    body: (
      <p>
        Podemos modificar estos términos; el uso continuado implica aceptar la versión vigente. Se rigen por las leyes
        de la República Argentina.
      </p>
    ),
  },
];

export default function TerminosPage() {
  return (
    <PageShell
      icon={FileText}
      title="Términos de Servicio"
      subtitle="Las condiciones para usar TryOnHub como cliente o como marca."
      widthClass="max-w-3xl"
    >
      <LegalDocument updated="10 de noviembre de 2026" sections={SECTIONS} />
    </PageShell>
  );
}

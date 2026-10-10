import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/domain/constants";

// La pantalla de entrada es la primera del menú lateral (Empresas radar).
// Sirve también para el login (router.push("/")) y para el start_url de la PWA.
export default function Home() {
  redirect(APP_ROUTES.EMPRESAS_RADAR);
}
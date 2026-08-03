import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmado?: string }>;
}) {
  const { confirmado } = await searchParams;
  return <LoginForm confirmado={confirmado === "pendente"} />;
}

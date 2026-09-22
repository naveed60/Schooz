export default async function TenantPlaceholderPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  return (
    <main className='shell'>
      <h1>{schoolSlug}</h1>
      <p>Tenant administration will be added in a later module.</p>
    </main>
  );
}

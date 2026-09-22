import { resolveSchoolContextCached } from '@/server/authorization';
import { PageHeader } from '@/components/tenant';
import { updateSchoolSettingsAction, uploadSchoolLogoAction } from '@/server/settings/actions';
import { getSchoolSettings } from '@/server/settings/service';

export default async function SchoolSettingsPage({
  params,
}: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params;
  const context = await resolveSchoolContextCached(schoolSlug);
  const settings = await getSchoolSettings(context);
  const canUpdate = context.permissions.includes('school/settings:update');
  return (
    <div>
      <PageHeader eyebrow='School settings' title={settings.name} description='Manage the configuration used across your school workspace.' />
      <section className='settings-card'>
        <h2>Regional settings</h2>
        {canUpdate ? <form action={updateSchoolSettingsAction} className='auth-form'>
          <input type='hidden' name='schoolSlug' value={schoolSlug} />
          <label>Timezone<input name='timezone' defaultValue={settings.timezone} required /></label>
          <label>Currency code<input name='currencyCode' defaultValue={settings.currencyCode.trim()} maxLength={3} required /></label>
          <label>Date format<select name='dateFormat' defaultValue={settings.dateFormat}><option>YYYY-MM-DD</option><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select></label>
          <label>Student number prefix<input name='studentNumberPrefix' defaultValue={settings.studentNumberPrefix ?? ''} maxLength={20} /></label>
          <label>Invoice number prefix<input name='invoiceNumberPrefix' defaultValue={settings.invoiceNumberPrefix ?? ''} maxLength={20} /></label>
          <button type='submit'>Save settings</button>
        </form> : <p>You can view settings but do not have permission to update them.</p>}
      </section>
      <section className='settings-card'>
        <h2>School logo</h2>
        <p>Logo files are private and tenant-scoped. They are not published as public assets.</p>
        {canUpdate && <form action={uploadSchoolLogoAction} className='auth-form' encType='multipart/form-data'>
          <input type='hidden' name='schoolSlug' value={schoolSlug} />
          <input name='logo' type='file' accept='.jpg,.jpeg,.png,.webp' required />
          <button type='submit'>Upload logo</button>
        </form>}
      </section>
    </div>
  );
}

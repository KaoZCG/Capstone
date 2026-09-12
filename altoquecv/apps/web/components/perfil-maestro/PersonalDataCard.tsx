import { UserProfile } from "@/types/perfil";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";

export function PersonalDataCard({ data }: { data: UserProfile["personalData"] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h3 className="text-headline-md text-on-surface">Datos Personales</h3>
        <Badge variant="success">Completado</Badge>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center gap-4 shrink-0">
          <Avatar src="professional_studio_headshot_of_a_chilean_professional_man_in_his_late_20s.png" alt={data.fullName} size="lg" />
          <button className="text-label-sm text-primary hover:underline font-medium">Cambiar foto</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Nombre Completo</label>
            <Input defaultValue={data.fullName} />
          </div>
          <div>
            <label className="flex justify-between text-label-sm text-on-surface-variant mb-1.5">
              <span>RUT / Cédula</span>
              {data.isRutVerified && <span className="text-success">✓ Verificado</span>}
            </label>
            <Input defaultValue={data.rut} disabled className="bg-surface-container-low" />
          </div>
          <div>
            <label className="flex justify-between text-label-sm text-on-surface-variant mb-1.5">
              <span>Correo Electrónico</span>
              {data.isEmailVerified && <span className="text-success">✓ Verificado</span>}
            </label>
            <Input defaultValue={data.email} type="email" />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Teléfono Móvil</label>
            <div className="flex gap-2">
              <Input defaultValue={data.phoneCode} className="w-20 text-center" />
              <Input defaultValue={data.phone} className="flex-1" />
            </div>
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Región</label>
            <Input defaultValue={data.region} />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1.5">Comuna</label>
            <Input defaultValue={data.comuna} />
          </div>
        </div>
      </div>
    </Card>
  );
}

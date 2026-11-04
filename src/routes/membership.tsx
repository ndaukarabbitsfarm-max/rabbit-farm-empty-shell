import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TRBA, isValidNida, isValidTanzaniaPhone, memberCode } from "@/lib/trba";
export const Route = createFileRoute("/membership")({ head: () => ({ meta: [{ title: "Uanachama — TRBA" }, { name: "description", content: "Usajili wa wanachama na kitambulisho cha kidijitali cha TRBA." }, { property: "og:title", content: "Uanachama — TRBA" }, { property: "og:description", content: "Jiunge na Tanzania Rabbit Breeders Association." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: MembershipPage });
function MembershipPage() {
 const { user, profile, loading } = useAuth(); const qc = useQueryClient(); const [saving,setSaving] = useState(false);
 const {data: member, isPending, error} = useQuery({queryKey:["trba-member", user?.id], enabled:!!user, queryFn: async()=>{ if(!user) return null; const {data,error}=await supabase.from("trba_members").select("*").eq("user_id",user.id).maybeSingle(); if(error) throw error; return data; }});
 async function register(e:React.FormEvent<HTMLFormElement>){e.preventDefault(); if(!user)return; const f=new FormData(e.currentTarget); const nida=String(f.get("nida_number")).replace(/\D/g,""); const phone=String(f.get("phone")); if(!isValidNida(nida)){toast.error("NIDA inahitaji tarakimu 20.");return;} if(!isValidTanzaniaPhone(phone)){toast.error("Weka namba halali ya simu ya Tanzania.");return;} setSaving(true); try {const {error}=await supabase.from("trba_members").insert({user_id:user.id,full_name:String(f.get("full_name")),nida_number:nida,region:String(f.get("region")),phone,email:String(f.get("email"))}); if(error)throw error; await qc.invalidateQueries({queryKey:["trba-member"]}); toast.success("Ombi limepokelewa na kitambulisho cha usajili kiko tayari.");}catch{toast.error("Usajili haujahifadhiwa. Hakikisha NIDA haijasajiliwa tayari na ujaribu tena.");}finally{setSaving(false);}}
 return <MobileShell title="Uanachama" subtitle="Member portal · TRBA" hideFab>
 <div className="space-y-5 p-5">
 {loading ? <p>Inapakia…</p> : !user ? <><h2 className="text-xl font-semibold">Jiunge na TRBA</h2><Button asChild><Link to="/auth">Ingia / Fungua akaunti</Link></Button></> : isPending ? <p>Inapakia uanachama…</p> : error ? <p role="alert">Taarifa hazikupatikana. Tafadhali jaribu tena.</p> : member ? <>
 <div id="membership-card" className="membership-card overflow-hidden rounded-lg border border-gold bg-card">
 <div className="flex items-center justify-between bg-primary p-5 text-primary-foreground"><div><p className="text-2xl font-bold">TRBA</p><p className="mt-1 text-xs">Tanzania Rabbit Breeders Association</p></div><ShieldCheck className="h-9 w-9 text-gold"/></div>
 <div className="space-y-4 p-5"><p className="text-xs font-semibold uppercase text-muted-foreground">Digital membership card</p><h2 className="text-xl font-bold">{member.full_name}</h2><p className="font-mono text-lg text-primary">{memberCode(member.member_number)}</p><div className="flex justify-between gap-3 text-sm"><span>{member.region}</span><span>{member.status==="approved"?"Mwanachama aliyeidhinishwa":member.status==="pending"?"Usajili · Unasubiri idhini":"Ombi limekataliwa"}</span></div><p className="border-t pt-3 text-xs text-muted-foreground">{TRBA.slogan}</p></div></div>
 <Button variant="outline" onClick={()=>window.print()}><Download className="mr-2 h-4 w-4"/>Chapisha / Hifadhi PDF</Button>
 <p className="text-sm text-muted-foreground">{member.status==="approved"?"Uanachama wako umeidhinishwa. Unaweza kusajili sungura na nasaba zao.":member.status==="pending"?"Viongozi wanahakiki ombi lako. Kitambulisho kitaonyesha idhini baada ya uhakiki.":"Wasiliana na chama kuhusu ombi lako."}</p><Button asChild><Link to="/registry">Fungua daftari la nasaba</Link></Button>
 </> : <form onSubmit={register} className="space-y-4"><CreditCard className="h-8 w-8 text-primary"/><h2 className="text-xl font-semibold">Usajili wa mwanachama</h2>{[["full_name","Jina kamili",profile?.full_name??"","text"],["nida_number","Namba ya NIDA","","text"],["region","Eneo / Mkoa",profile?.region??"","text"],["phone","Namba yako ya simu",profile?.phone??"","tel"],["email","Barua pepe yako",user.email??"","email"]].map(([name,label,value,type])=><div key={name} className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} defaultValue={value} required maxLength={name==="nida_number"?24:120}/></div>)}<label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1"/><span>Nakubali taarifa hizi kutumiwa kwa usajili na uhakiki wa chama. <Link to="/privacy" className="text-primary underline">Usiri wa taarifa</Link></span></label><Button disabled={saving} className="w-full">{saving?"Inahifadhi…":"Tuma ombi la uanachama"}</Button></form>}
 <section className="border-t pt-4 text-sm"><h3 className="font-semibold">Mawasiliano ya chama</h3><a className="mt-2 block text-primary" href={`tel:${TRBA.phone}`}>{TRBA.phone}</a><a className="block break-all text-primary" href={`mailto:${TRBA.email}`}>{TRBA.email}</a></section>
 </div></MobileShell>;
}

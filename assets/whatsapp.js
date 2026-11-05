/* Compact, shared order text. No network calls or tracking side effects. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.OgumWhatsApp=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const money=value=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function request(s,pricing,{help=false}={}){
    const lines=[help?'Olá! Preciso de ajuda para montar minha peça:':'Olá! Quero encomendar:', ''];
    if(clean(s.name)) lines[0]=`Olá! Sou ${clean(s.name)}. ${help?'Preciso de ajuda para montar minha peça:':'Quero encomendar:'}`;
    const kind={guia:'Guia',braja:'Brajá',chicote:'Chicote'}[s.kind];
    if(kind) lines.push(`*Peça:* ${kind}${['1','3','7'].includes(String(s.threads))?' de '+s.threads+(String(s.threads)==='1'?' fio':' fios'):''}`);
    if(clean(s.entity)) lines.push(`*Referência:* ${clean(s.entity)}`);
    const colors=[...(s.colors||[]),clean(s.customColors)].filter(Boolean);
    if(colors.length) lines.push(`*Cores:* ${colors.join(', ')}`);
    if(s.length!=='unknown'&&s.length) lines.push(`*Medida:* ${s.length==='custom'?clean(s.customLength):s.length} cm (peça estendida)`);
    const assembly=[{trancada:'Trançada',soltos:'Fios soltos'}[s.finish],{fechada:'receber fechada',aberta:'receber aberta'}[s.delivery]].filter(Boolean);
    if(assembly.length) lines.push(`*Montagem:* ${assembly.join(' · ')}`);
    const materials=[{vidro:'Vidro comum',jablonex:'Referência Jablonex'}[s.beads],{sem:'sem firma',vidro:'firma simples de vidro',murano:'firma em murano'}[s.firm]].filter(Boolean);
    if(materials.length) lines.push(`*Material:* ${materials.join(' · ')}`);
    if(s.extras?.length) lines.push(`*Detalhes:* ${s.extras.join(', ')}`);
    if(clean(s.notes)) lines.push(`*Observações:* ${clean(s.notes)}`);
    if(Number(s.quantity)>1) lines.push(`*Quantidade:* ${s.quantity} peças iguais`);
    if(clean(s.cep)) lines.push(`*CEP:* ${clean(s.cep)}`);
    const q=pricing?.quote(s);
    if(q){
      lines.push(`*Estimativa:* ${money(q.total)}${Number(s.quantity)>1?' no total':''} · sem frete`);
      const base=[s.length==='unknown'?'100 cm':null,s.beads==='confirmar'?'vidro comum':null,s.firm==='confirmar'?'firma simples':null].filter(Boolean);
      if(base.length) lines.push(`Base da estimativa: ${base.join(' · ')}.`);
    }else lines.push('*Valor:* orçamento com o ateliê');
    if(s.requestId) lines.push('',`Ref. ${clean(s.requestId)}`);
    return lines.join('\n');
  }
  return {request};
});

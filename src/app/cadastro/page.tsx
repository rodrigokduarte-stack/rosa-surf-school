// Adicione este botão dentro do seu Header da aba Alunos
<button
  onClick={() => {
    const url = `${window.location.origin}/cadastro`
    navigator.clipboard.writeText(url)
    alert("Link de cadastro copiado! Agora é só colar no WhatsApp do cliente. 🏄‍♂️")
  }}
  className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 transition-all flex items-center gap-1.5"
>
  <Share2 size={12} /> Copiar Link p/ Cliente
</button>
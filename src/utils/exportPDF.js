export function exportarPDF({ disciplinas, estatisticas, userName, userCurso, periodos }) {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    throw new Error('jsPDF não está disponível!');
  }

  const doc = new jsPDF();
  const podeGraficos = true;

  const isPremium = podeGraficos;
  const corPrincipal = isPremium ? [245, 158, 11] : [59, 130, 246];
  const corSecundaria = isPremium ? [217, 119, 6] : [37, 99, 235];

  const emerald = [16, 185, 129];
  const blue = [59, 130, 246];
  const red = [239, 68, 68];
  const amber = [245, 158, 11];
  const violet = [124, 58, 237];
  const gray700 = [55, 65, 81];
  const gray600 = [75, 85, 99];
  const gray400 = [156, 163, 175];
  const gray200 = [229, 231, 235];
  const gray100 = [243, 244, 246];
  const black = [17, 24, 39];
  const white = [255, 255, 255];

  const drawGradient = (x, y, w, h, color1, color2) => {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
      const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
      const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(x, y + (h / steps) * i, w, h / steps + 0.5, 'F');
    }
  };

  const drawPieChart = (cx, cy, radius, data) => {
    let startAngle = -Math.PI / 2;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;

    data.forEach(item => {
      if (item.value === 0) return;
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      doc.setFillColor(...item.color);

      const steps = Math.max(1, Math.floor(sliceAngle * 20));
      for (let i = 0; i < steps; i++) {
        const a1 = startAngle + (sliceAngle * i / steps);
        const a2 = startAngle + (sliceAngle * (i + 1) / steps);
        const x1 = cx + Math.cos(a1) * radius;
        const y1 = cy + Math.sin(a1) * radius;
        const x2 = cx + Math.cos(a2) * radius;
        const y2 = cy + Math.sin(a2) * radius;

        doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
      }

      startAngle = endAngle;
    });

    doc.setFillColor(...white);
    doc.circle(cx, cy, radius * 0.5, 'F');
  };

  const disciplinasComNota = disciplinas
    .filter(d => d.notaFinal && d.status === 'APROVADA')
    .sort((a, b) => b.notaFinal - a.notaFinal);
  const top5Notas = disciplinasComNota.slice(0, 5);

  const creditosPorSemestre = 30;
  const creditosFaltando = disciplinas
    .filter(d => d.tipo !== 'optativa' && d.status !== 'APROVADA')
    .reduce((sum, d) => sum + (d.creditos || 4), 0);
  const semestresRestantes = Math.ceil(creditosFaltando / creditosPorSemestre);
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const semestreAtual = mesAtual < 6 ? 1 : 2;
  let anoFormatura = anoAtual;
  let semestreFormatura = semestreAtual;
  for (let i = 0; i < semestresRestantes; i++) {
    semestreFormatura++;
    if (semestreFormatura > 2) {
      semestreFormatura = 1;
      anoFormatura++;
    }
  }

  // ============ PÁGINA 1: CAPA ============

  if (isPremium) {
    drawGradient(0, 0, 210, 80, corPrincipal, corSecundaria);

    doc.setFillColor(255, 255, 255, 0.2);
    doc.circle(105, 40, 25, 'F');
    doc.setFontSize(28);
    doc.setTextColor(...white);
    doc.text('🎓', 97, 48);

    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text('Grade Curricular', 105, 105, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...gray600);
    doc.text(userCurso || 'Ciencia da Computacao', 105, 118, { align: 'center' });

    doc.setDrawColor(...corPrincipal);
    doc.setLineWidth(1);
    doc.line(60, 128, 150, 128);

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text(userName || 'Estudante', 105, 148, { align: 'center' });

    const capaCardY = 165;
    const capaCards = [
      { label: 'Aprovadas', value: estatisticas.aprovadas, color: emerald },
      { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%`, color: corPrincipal },
      { label: 'Media', value: estatisticas.mediaGeral.toFixed(1), color: violet },
    ];

    capaCards.forEach((card, i) => {
      const x = 30 + (55 * i);

      doc.setFillColor(...gray100);
      doc.roundedRect(x, capaCardY, 50, 40, 4, 4, 'F');

      doc.setFillColor(...card.color);
      doc.roundedRect(x, capaCardY, 50, 4, 4, 4, 'F');
      doc.rect(x, capaCardY + 2, 50, 2, 'F');

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text(String(card.value), x + 25, capaCardY + 22, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray600);
      doc.text(card.label, x + 25, capaCardY + 33, { align: 'center' });
    });

    if (semestresRestantes > 0) {
      doc.setFillColor(...corPrincipal);
      doc.roundedRect(55, 220, 100, 24, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setTextColor(...white);
      doc.text('Previsao de Formatura', 105, 232, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${semestreFormatura}. Semestre de ${anoFormatura}`, 105, 240, { align: 'center' });
    } else {
      doc.setFillColor(...emerald);
      doc.roundedRect(55, 220, 100, 24, 4, 4, 'F');
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text('Curso Concluido!', 105, 236, { align: 'center' });
    }

    doc.setFontSize(9);
    doc.setTextColor(...gray400);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 105, 260, { align: 'center' });

    doc.setFillColor(...corPrincipal);
    doc.roundedRect(75, 275, 60, 12, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('PREMIUM', 105, 283, { align: 'center' });

    doc.addPage();
  }

  // ============ PÁGINA DE DISCIPLINAS ============

  if (!isPremium) {
    doc.setFillColor(...corPrincipal);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('Grade Curricular', 14, 22);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(userCurso || 'Ciencia da Computacao', 14, 30);
  } else {
    doc.setFillColor(...gray100);
    doc.rect(0, 0, 210, 25, 'F');

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...gray700);
    doc.text('Disciplinas por Semestre', 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(...gray400);
    doc.text(`${userName} - ${userCurso}`, 196, 16, { align: 'right' });
  }

  let y = isPremium ? 35 : 45;

  if (!isPremium) {
    doc.setFontSize(9);
    doc.setTextColor(...gray600);
    doc.text(`${userName || 'Estudante'}  •  ${new Date().toLocaleDateString('pt-BR')}`, 14, y);

    const statsText = `${estatisticas.aprovadas} aprov.  •  ${estatisticas.progresso.toFixed(0)}%  •  Media ${estatisticas.mediaGeral.toFixed(1)}`;
    doc.text(statsText, 196, y, { align: 'right' });
    y += 10;
  }

  periodos.forEach(periodo => {
    const discs = disciplinas.filter(d => d.periodo === periodo);
    if (discs.length === 0) return;

    const espacoNecessario = 14 + (discs.length * 8);
    if (y + espacoNecessario > 280) {
      doc.addPage();
      if (isPremium) {
        doc.setFillColor(...gray100);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setFontSize(9);
        doc.setTextColor(...gray400);
        doc.text('Disciplinas (continuacao)', 14, 10);
      }
      y = isPremium ? 25 : 20;
    }

    const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
    const percentual = Math.round((aprovadas / discs.length) * 100);

    const headerColor = percentual === 100 ? emerald : percentual >= 50 ? corPrincipal : gray400;
    doc.setFillColor(...headerColor);
    doc.roundedRect(14, y - 4, 182, 10, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text(`${periodo}. Semestre`, 18, y + 3);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${aprovadas}/${discs.length} (${percentual}%)`, 192, y + 3, { align: 'right' });

    y += 12;

    discs.forEach(d => {
      if (y > 285) {
        doc.addPage();
        if (isPremium) {
          doc.setFillColor(...gray100);
          doc.rect(0, 0, 210, 15, 'F');
        }
        y = isPremium ? 25 : 20;
      }

      const nota = d.notaFinal ? d.notaFinal.toFixed(1) : null;

      const statusColors = {
        'APROVADA': emerald,
        'EM_CURSO': blue,
        'REPROVADA': red,
        'NAO_INICIADA': gray200
      };
      doc.setFillColor(...(statusColors[d.status] || gray200));
      doc.circle(18, y - 1, 2, 'F');

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...black);
      const nomeDisplay = d.nome.length > 50 ? d.nome.substring(0, 50) + '...' : d.nome;
      doc.text(nomeDisplay, 24, y);

      doc.setTextColor(...gray400);
      let infoRight = `${d.creditos}cr`;
      if (nota) infoRight = `${nota} • ${d.creditos}cr`;
      doc.text(infoRight, 196, y, { align: 'right' });

      y += 7;
    });

    y += 6;
  });

  // ============ PÁGINA DE RESUMO ============
  doc.addPage();

  if (isPremium) {
    drawGradient(0, 0, 210, 40, corPrincipal, corSecundaria);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('Analise Completa', 105, 26, { align: 'center' });

    const statsY = 50;
    const statsCards = [
      { label: 'Total', value: estatisticas.total, color: gray600 },
      { label: 'Aprovadas', value: estatisticas.aprovadas, color: emerald },
      { label: 'Em Curso', value: estatisticas.emCurso, color: blue },
      { label: 'Reprovadas', value: estatisticas.reprovadas, color: red },
      { label: 'Pendentes', value: estatisticas.naoIniciadas, color: gray400 },
    ];

    statsCards.forEach((card, i) => {
      const x = 10 + (39 * i);

      doc.setFillColor(...gray100);
      doc.roundedRect(x, statsY, 37, 28, 3, 3, 'F');

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...card.color);
      doc.text(String(card.value), x + 18.5, statsY + 14, { align: 'center' });

      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray600);
      doc.text(card.label, x + 18.5, statsY + 23, { align: 'center' });
    });

    const pieData = [
      { value: estatisticas.aprovadas, color: emerald },
      { value: estatisticas.emCurso, color: blue },
      { value: estatisticas.reprovadas, color: red },
      { value: estatisticas.naoIniciadas, color: gray400 },
    ];

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text('Distribuicao', 14, 95);

    drawPieChart(55, 130, 28, pieData);

    const legendItems = [
      { label: 'Aprovadas', color: emerald },
      { label: 'Em Curso', color: blue },
      { label: 'Reprovadas', color: red },
      { label: 'Pendentes', color: gray400 },
    ];

    legendItems.forEach((item, i) => {
      const ly = 108 + (i * 12);
      doc.setFillColor(...item.color);
      doc.circle(95, ly, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...gray600);
      doc.text(item.label, 101, ly + 1);
    });

    doc.setFillColor(...corPrincipal);
    doc.roundedRect(140, 95, 56, 55, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...white);
    doc.text('Media Geral', 168, 108, { align: 'center' });

    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text(estatisticas.mediaGeral.toFixed(2), 168, 135, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text('Desempenho por Semestre', 14, 170);

    let barY = 180;
    const barMaxWidth = 100;

    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      if (discs.length === 0) return;
      if (barY > 240) return;

      const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
      const percentual = (aprovadas / discs.length) * 100;
      const filledWidth = (percentual / 100) * barMaxWidth;

      doc.setFontSize(8);
      doc.setTextColor(...gray600);
      doc.text(`${periodo}. Sem`, 14, barY + 4);

      doc.setFillColor(...gray200);
      doc.roundedRect(38, barY, barMaxWidth, 6, 2, 2, 'F');

      if (filledWidth > 0) {
        const barColor = percentual >= 80 ? emerald : percentual >= 50 ? amber : red;
        doc.setFillColor(...barColor);
        doc.roundedRect(38, barY, Math.max(filledWidth, 3), 6, 2, 2, 'F');
      }

      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...gray700);
      doc.text(`${percentual.toFixed(0)}%`, 145, barY + 4);

      barY += 10;
    });

    if (top5Notas.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text('Top 5 Melhores Notas', 14, 260);

      top5Notas.forEach((d, i) => {
        const ry = 268 + (i * 6);

        const medalColors = [[255, 215, 0], [192, 192, 192], [205, 127, 50], gray400, gray400];
        doc.setFillColor(...medalColors[i]);
        doc.circle(18, ry, 2, 'F');

        doc.setFontSize(8);
        doc.setTextColor(...black);
        const nomeRank = d.nome.length > 35 ? d.nome.substring(0, 35) + '...' : d.nome;
        doc.text(nomeRank, 24, ry + 1);

        doc.setFont(undefined, 'bold');
        doc.setTextColor(...emerald);
        doc.text(d.notaFinal.toFixed(1), 150, ry + 1);
      });
    }

    doc.setFillColor(...gray100);
    doc.roundedRect(160, 170, 40, 75, 4, 4, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...gray600);
    doc.text('Formatura', 180, 182, { align: 'center' });

    if (semestresRestantes > 0) {
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...corPrincipal);
      doc.text(String(semestresRestantes), 180, 205, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray600);
      doc.text('semestres', 180, 215, { align: 'center' });
      doc.text('restantes', 180, 222, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text(`${semestreFormatura}/${anoFormatura}`, 180, 238, { align: 'center' });
    } else {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...emerald);
      doc.text('Concluido!', 180, 210, { align: 'center' });
    }

    doc.setFontSize(8);
    doc.setTextColor(...corPrincipal);
    doc.text('Relatorio Premium - Sistema de Notas', 105, 292, { align: 'center' });

  } else {
    doc.setFillColor(...corPrincipal);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('Resumo', 14, 20);

    const cardY = 45;
    const cards = [
      { label: 'Total', value: estatisticas.total },
      { label: 'Aprovadas', value: estatisticas.aprovadas },
      { label: 'Em Curso', value: estatisticas.emCurso },
      { label: 'Progresso', value: `${estatisticas.progresso.toFixed(0)}%` },
    ];

    cards.forEach((card, i) => {
      const x = 14 + (46 * i);

      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...black);
      doc.text(String(card.value), x, cardY + 8);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray400);
      doc.text(card.label, x, cardY + 16);
    });

    doc.setFillColor(...corPrincipal);
    doc.roundedRect(14, 75, 182, 28, 4, 4, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...white);
    doc.text('Media Geral Ponderada', 24, 91);

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(estatisticas.mediaGeral.toFixed(2), 186, 92, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text('Por Semestre', 14, 120);

    let listY = 130;
    periodos.forEach(periodo => {
      const discs = disciplinas.filter(d => d.periodo === periodo);
      if (discs.length === 0) return;

      const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
      const percentual = ((aprovadas/discs.length)*100).toFixed(0);

      doc.setFontSize(9);
      doc.setTextColor(...gray600);
      doc.text(`${periodo}. Semestre`, 14, listY);
      doc.setTextColor(...gray400);
      doc.text(`${aprovadas}/${discs.length} (${percentual}%)`, 186, listY, { align: 'right' });

      listY += 9;
    });

    doc.setFontSize(8);
    doc.setTextColor(...corPrincipal);
    doc.text('Sistema de Notas - Pro', 105, 288, { align: 'center' });
  }

  doc.save(`grade-curricular-${isPremium ? 'premium' : 'pro'}-${new Date().toISOString().split('T')[0]}.pdf`);
}

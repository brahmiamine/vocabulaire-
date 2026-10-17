// Optional starter pack. Words are only added after the learner chooses to import them.
const rows = [
['Tiquer','Réagir parce qu’un détail paraît étrange.','يستغرب أمرًا ما','J’ai tiqué quand j’ai vu le prix.','Quotidien'],
['Piquer','Faire une petite douleur ou une remarque blessante.','يلسع أو يجرح','Cette remarque m’a un peu piqué.','Quotidien'],
['Malin','Intelligent, parfois rusé.','ذكي أو ماكر','C’est malin d’anticiper ce problème.','Quotidien'],
['Stagner','Ne plus avancer ou progresser.','يراوِح مكانه','J’ai l’impression de stagner en français.','Travail'],
['L’ambition','La volonté d’atteindre un objectif important.','الطموح','Son ambition, c’est de changer de métier.','Quotidien'],
['Avoir la flemme','Ne pas avoir envie de faire un effort.','لا تكون لديه رغبة في بذل جهد','J’ai la flemme de sortir ce soir.','Expressions'],
['Galérer','Rencontrer des difficultés.','يعاني صعوبات','J’ai galéré à comprendre cette phrase.','Expressions'],
['Décaler','Déplacer à un autre moment.','يؤجّل أو يغيّر الموعد','On peut décaler la réunion à demain ?','Travail'],
['Assumer','Accepter et prendre la responsabilité.','يتحمّل المسؤولية','J’assume complètement ma décision.','Travail'],
['Se libérer','Se rendre disponible.','يتفرّغ','Je peux me libérer vers 15 heures.','Travail'],
['Lâcher','Abandonner ou arrêter de tenir.','يتخلّى أو يُفلت','Il faut parfois lâcher prise.','Expressions'],
['Gaspiller','Utiliser inutilement une ressource.','يُهدر','Je ne veux pas gaspiller mon temps.','Quotidien'],
['Gâcher','Abîmer un moment ou une occasion.','يُفسد','Ne gâche pas ton week-end pour ça.','Quotidien'],
['Fouiller','Chercher attentivement dans un endroit.','يفتّش','J’ai fouillé mon sac pour mes clés.','Quotidien'],
['Un contretemps','Un imprévu qui cause un retard.','طارئ يسبّب تأخيرًا','J’ai eu un contretemps ce matin.','Travail'],
['Une anomalie','Un détail qui ne fonctionne pas normalement.','خلل أو أمر غير طبيعي','J’ai repéré une anomalie dans le tableau.','Travail'],
['Un bon plan','Une occasion pratique ou avantageuse.','فرصة جيدة','Tu connais un bon plan pour le train ?','Expressions'],
['Tant pis','On accepte une situation décevante.','لا بأس، على أي حال','Le magasin est fermé ? Tant pis !','Expressions'],
['À froid','Après un temps de recul, sans émotion immédiate.','بهدوء بعد مرور وقت','On en reparlera à froid demain.','Expressions'],
['Ça tombe bien','Quelque chose arrive au bon moment.','جاء في الوقت المناسب','Ça tombe bien, j’allais t’appeler.','Expressions'],
['Se démarquer','Se distinguer des autres.','يتميّز عن الآخرين','Son expérience le démarque des autres candidats.','Travail'],
['Prendre du recul','Regarder une situation avec plus de distance.','ينظر إلى الأمر بموضوعية','Prends du recul avant de répondre.','Expressions'],
['Clivant','Qui provoque des avis très opposés.','مثير للانقسام','C’est un sujet assez clivant.','Quotidien'],
['Un compromis','Un accord où chacun fait des concessions.','حلّ وسط','On a trouvé un compromis acceptable.','Quotidien'],
['Rentabiliser','Faire en sorte que quelque chose rapporte assez.','يجعل شيئًا مربحًا','Je veux rentabiliser cet abonnement.','Quotidien'],
['Une coupure','Un billet de banque, ou une interruption selon le contexte.','ورقة نقدية أو انقطاع','Tu as une coupure de vingt euros ?','Quotidien'],
['Un tarif attractif','Un prix intéressant par rapport au marché.','سعر مغرٍ','Ils proposent un tarif attractif.','Quotidien'],
['La tarification dynamique','Des prix qui changent selon la demande.','تسعير متغيّر حسب الطلب','La tarification dynamique fait monter le prix du billet.','Quotidien'],
['Au détriment de','En causant un désavantage à quelque chose.','على حساب','Il travaille beaucoup au détriment de son sommeil.','Expressions'],
['Un faussaire','Une personne qui fabrique de faux documents ou objets.','مزوّر','La police a arrêté un faussaire.','Quotidien']
]
export const starter = rows.map(([term,meaning,translation_ar,example,category])=>({
  term,meaning,translation_ar,example,category,source:'Pack de démarrage',learned_on:'2026-10-16'
}))

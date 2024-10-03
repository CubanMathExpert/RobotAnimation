Antony Leclerc 20271552
Raphael Osvaldo Gonzalez Carvajal 20161430

Redonner vie au robot (10 pts).
Les trois fonctions sont implémentées.
2. Ajouter des bras au robot (30 pts).
(a) Fait, sans commentaires
(b) Fait, sans commentaires
3. Ajouter des jambes au robot (40 pts).
(a) Fait, sans commentaires
(b) Fait, sans commentaires
(c) Alterner entre l'avant et l'arriere rapidement peut causer des problemes numerique. La fonctionalite de marche arriere est optionnelle selon le tpiste.
(d) Fait, sans commentaires
4. Donner des yeux au robot (20 pts).
Fait, j'ai ajouté une fonction qui ajoute la fonctionnalité pour gérer le cas où il se regarde lui-même. 
Il utilise dans ce cas deux axes pour se regarder avec sa tête,
mais cela cause des problèmes limites quand il regarde derrière lui ou loin de lui dans des angles obscures.
Par contre, si on retourne au sol, il retourne à la normale et il est sans bug sans cette implémentation additionnelle.
Si mon if case est retiré, il agit normalement quand on le pointe,
mais c'est un peu buggy en temps continue quand il se regarde dans le cas normale.
D'où vient la motivation d'essayer de le "fixer".

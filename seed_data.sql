-- ============================================
-- MetaMuse - Données de test (Juin 2026)
-- Exécuter dans phpMyAdmin ou MySQL CLI
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Nettoyage
DELETE FROM ticket;
DELETE FROM order_item;
DELETE FROM `order`;
DELETE FROM notification;
DELETE FROM planning;
DELETE FROM lesson;
DELETE FROM course;
DELETE FROM event;
DELETE FROM artwork;
DELETE FROM product;
DELETE FROM category;
DELETE FROM catalogue;
DELETE FROM user;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- UTILISATEURS (mot de passe: Password1!)
-- BCrypt hash de "Password1!" avec cost 12
SET @PWD = '$2a$12$2wWACK3ExNUu8AFRsWsC1O/H/y3K5APCjYSpzCwCVqDnGGKlO8Zoq';

INSERT INTO user (id_number, username, email, password, role) VALUES
('USR_ADMIN', 'admin', 'admin@metamuse.tn', @PWD, 'ADMIN'),
('USR_ART01', 'sofia_benali', 'sofia@metamuse.tn', @PWD, 'ARTIST'),
('USR_ART02', 'karim_mejri', 'karim@metamuse.tn', @PWD, 'ARTIST'),
('USR_ART03', 'leila_trabelsi', 'leila@metamuse.tn', @PWD, 'ARTIST'),
('USR_VIS01', 'ahmed_visitor', 'ahmed@gmail.com', @PWD, 'VISITOR'),
('USR_VIS02', 'nadia_visitor', 'nadia@gmail.com', @PWD, 'VISITOR'),
('USR_VIS03', 'youssef_client', 'youssef@gmail.com', @PWD, 'VISITOR');

-- ============================================
-- CATEGORIES & CATALOGUES
-- ============================================
INSERT INTO category (id, name) VALUES
(1, 'Peinture'),
(2, 'Sculpture'),
(3, 'Photographie'),
(4, 'Art numérique'),
(5, 'Céramique');

INSERT INTO catalogue (id, name, description) VALUES
(1, 'Collection Printemps 2026', 'Nouvelles créations du printemps'),
(2, 'Art Contemporain', 'Œuvres contemporaines tunisiennes'),
(3, 'Patrimoine', 'Inspirations du patrimoine méditerranéen');

-- ============================================
-- ARTWORKS (sans images, ajoutez-les via l'app)
-- ============================================
INSERT INTO artwork (id, title, description, `year`, artist_id, category_id, catalogue_id) VALUES
(1, 'Lumière de Sidi Bou Saïd', 'Peinture à l''huile inspirée des ruelles bleues et blanches', 2026, 'USR_ART01', 1, 3),
(2, 'Médina au crépuscule', 'Aquarelle représentant la médina de Tunis au coucher du soleil', 2026, 'USR_ART01', 1, 2),
(3, 'Fragments de mémoire', 'Sculpture en terre cuite mêlant modernité et tradition', 2025, 'USR_ART02', 2, 2),
(4, 'Reflets de Carthage', 'Photographie grand format des ruines au lever du jour', 2026, 'USR_ART02', 3, 3),
(5, 'Géométrie sacrée', 'Art numérique génératif basé sur les motifs islamiques', 2026, 'USR_ART03', 4, 2),
(6, 'Vases du Sud', 'Série de céramiques inspirées de l''artisanat de Djerba', 2026, 'USR_ART03', 5, 3),
(7, 'Portrait de la Goulette', 'Peinture acrylique sur toile grand format', 2026, 'USR_ART01', 1, 1),
(8, 'Danse des dunes', 'Art numérique — animation figée du Sahara', 2026, 'USR_ART03', 4, 1),
(9, 'Le pêcheur de Mahdia', 'Photographie noir et blanc', 2025, 'USR_ART02', 3, 3),
(10, 'Mosaïque vivante', 'Installation céramique murale', 2026, 'USR_ART03', 5, 2);

-- ============================================
-- PRODUITS (Marketplace)
-- ============================================
INSERT INTO product (id, name, description, price, stock) VALUES
(1, 'Poster Sidi Bou Saïd', 'Reproduction haute qualité 50x70cm', 35.00, 20),
(2, 'Carte postale lot x10', 'Série artworks MetaMuse', 12.50, 50),
(3, 'Tote bag artiste', 'Sac en coton bio imprimé', 25.00, 30),
(4, 'Mug céramique peint', 'Mug artisanal peint à la main', 18.00, 15),
(5, 'Carnet de croquis A5', 'Papier épais 200g, 80 pages', 22.00, 40),
(6, 'Miniature sculpture', 'Réplique miniature en résine', 45.00, 10),
(7, 'Écharpe en soie', 'Impression motifs géométriques', 55.00, 8),
(8, 'Puzzle 1000 pièces', 'Reproduction Lumière de Sidi Bou Saïd', 28.00, 25);

-- ============================================
-- ÉVÉNEMENTS (Juin 2026)
-- ============================================
INSERT INTO event (id, name, theme, description, location, start_date, end_date, capacity, ticket_price_visitor, ticket_price_artist, status, featured, created_by, created_at, updated_at) VALUES
(1, 'Vernissage Collection Printemps', 'Art contemporain', 'Soirée d''ouverture de la nouvelle collection avec cocktail et rencontres artistes', 'Galerie MetaMuse, La Marsa', '2026-06-01', '2026-06-01', 100, 15.00, 10.00, 'COMPLETED', true, 'USR_ADMIN', NOW(), NOW()),
(2, 'Atelier Aquarelle en plein air', 'Peinture', 'Séance de peinture en extérieur au parc du Belvédère', 'Parc du Belvédère, Tunis', '2026-06-05', '2026-06-05', 25, 30.00, 20.00, 'COMPLETED', false, 'USR_ART01', NOW(), NOW()),
(3, 'Exposition Patrimoine Méditerranéen', 'Patrimoine', 'Deux semaines de découverte des œuvres inspirées du patrimoine tunisien', 'Centre culturel, Sidi Bou Saïd', '2026-06-07', '2026-06-21', 200, 20.00, 15.00, 'ONGOING', true, 'USR_ADMIN', NOW(), NOW()),
(4, 'Conférence Art Numérique', 'Technologie & Art', 'Les nouvelles tendances de l''art génératif et de l''IA créative', 'Cité des Sciences, Tunis', '2026-06-12', '2026-06-12', 150, 10.00, 5.00, 'COMPLETED', false, 'USR_ART03', NOW(), NOW()),
(5, 'Marché des artisans', 'Artisanat', 'Vente et démonstrations d''artisans céramistes et tisserands', 'Souk El Attarine, Médina', '2026-06-14', '2026-06-15', 300, 5.00, 0.00, 'COMPLETED', false, 'USR_ADMIN', NOW(), NOW()),
(6, 'Nuit de la Photographie', 'Photographie', 'Projection et exposition photo en nocturne', 'Dar El Marsa', '2026-06-18', '2026-06-18', 80, 25.00, 15.00, 'ONGOING', true, 'USR_ART02', NOW(), NOW()),
(7, 'Workshop Sculpture Moderne', 'Sculpture', 'Initiation à la sculpture contemporaine en argile', 'Atelier Karim, Carthage', '2026-06-22', '2026-06-23', 15, 50.00, 35.00, 'PUBLISHED', false, 'USR_ART02', NOW(), NOW()),
(8, 'Festival des Arts Visuels', 'Multi-disciplines', 'Grand festival réunissant peinture, photo, sculpture et art numérique', 'Amphithéâtre El Jem (espace annexe)', '2026-06-25', '2026-06-29', 500, 35.00, 25.00, 'PUBLISHED', true, 'USR_ADMIN', NOW(), NOW()),
(9, 'Soirée Jazz & Art', 'Musique & Art', 'Concert jazz accompagné d''une exposition éphémère', 'Dar Sebastian, Hammamet', '2026-06-28', '2026-06-28', 120, 40.00, 30.00, 'PUBLISHED', false, 'USR_ART01', NOW(), NOW());

-- ============================================
-- TICKETS (achats passés)
-- ============================================
INSERT INTO ticket (id, user_id, event_id, ticket_type, price, purchase_date) VALUES
(1, 'USR_VIS01', 1, 'VISITOR', 15.00, '2026-06-01'),
(2, 'USR_VIS02', 1, 'VISITOR', 15.00, '2026-06-01'),
(3, 'USR_ART01', 1, 'ARTIST', 10.00, '2026-06-01'),
(4, 'USR_VIS01', 3, 'VISITOR', 20.00, '2026-06-07'),
(5, 'USR_VIS03', 3, 'VISITOR', 20.00, '2026-06-08'),
(6, 'USR_ART02', 4, 'ARTIST', 5.00, '2026-06-12'),
(7, 'USR_VIS02', 4, 'VISITOR', 10.00, '2026-06-12'),
(8, 'USR_VIS01', 5, 'VISITOR', 5.00, '2026-06-14'),
(9, 'USR_VIS03', 5, 'VISITOR', 5.00, '2026-06-14'),
(10, 'USR_ART03', 5, 'ARTIST', 0.00, '2026-06-14'),
(11, 'USR_VIS02', 6, 'VISITOR', 25.00, '2026-06-18'),
(12, 'USR_ART01', 6, 'ARTIST', 15.00, '2026-06-18');

-- ============================================
-- COMMANDES
-- ============================================
INSERT INTO `order` (id, user_id, order_date, delivery_location, status) VALUES
(1, 'USR_VIS01', '2026-06-02', 'Rue de la Liberté 12, Tunis, 1000, Tunisie', 'DELIVERED'),
(2, 'USR_VIS02', '2026-06-05', 'Avenue Habib Bourguiba 45, La Marsa, 2078, Tunisie', 'DELIVERED'),
(3, 'USR_VIS03', '2026-06-08', 'Résidence Les Jasmins, Sousse, 4000, Tunisie', 'SHIPPED'),
(4, 'USR_VIS01', '2026-06-12', 'Rue de la Liberté 12, Tunis, 1000, Tunisie', 'CONFIRMED'),
(5, 'USR_ART01', '2026-06-15', 'Atelier Sofia, Sidi Bou Saïd, 2026, Tunisie', 'DELIVERED'),
(6, 'USR_VIS02', '2026-06-18', 'Avenue Habib Bourguiba 45, La Marsa, 2078, Tunisie', 'PENDING');

INSERT INTO order_item (id, order_id, product_id, quantity) VALUES
(1, 1, 1, 2),
(2, 1, 3, 1),
(3, 2, 2, 3),
(4, 2, 5, 1),
(5, 3, 4, 2),
(6, 3, 6, 1),
(7, 4, 7, 1),
(8, 4, 8, 2),
(9, 5, 5, 2),
(10, 5, 2, 1),
(11, 6, 1, 1),
(12, 6, 4, 1);

-- ============================================
-- COURS
-- ============================================
INSERT INTO course (id, title, description, artist_id, level, price, duration) VALUES
(1, 'Initiation à l''aquarelle', 'Découvrez les bases de la peinture aquarelle : mélanges, lavis et techniques humides', 'USR_ART01', 'BEGINNER', 45.00, 8),
(2, 'Photographie urbaine', 'Maîtriser la composition et la lumière en milieu urbain', 'USR_ART02', 'INTERMEDIATE', 60.00, 12),
(3, 'Art génératif avec Processing', 'Créer des œuvres numériques avec le code créatif', 'USR_ART03', 'ADVANCED', 80.00, 16),
(4, 'Sculpture argile pour débutants', 'Modelage, textures et cuisson — les fondamentaux', 'USR_ART02', 'BEGINNER', 55.00, 10),
(5, 'Céramique décorative', 'Techniques de décoration sur céramique émaillée', 'USR_ART03', 'INTERMEDIATE', 65.00, 12);

-- ============================================
-- PLANNING (séances de cours en juin 2026)
-- ============================================
INSERT INTO planning (id, course_id, start_time, end_time, room, status, notes) VALUES
(1, 1, '2026-06-03 09:00:00', '2026-06-03 12:00:00', 'Salle A1', 'COMPLETED', 'Introduction et matériel'),
(2, 1, '2026-06-10 09:00:00', '2026-06-10 12:00:00', 'Salle A1', 'COMPLETED', 'Techniques de lavis'),
(3, 2, '2026-06-04 14:00:00', '2026-06-04 17:00:00', 'Extérieur Médina', 'COMPLETED', 'Sortie photo Médina'),
(4, 3, '2026-06-06 10:00:00', '2026-06-06 13:00:00', 'Lab Info B2', 'COMPLETED', 'Setup Processing + premiers sketches'),
(5, 4, '2026-06-09 09:30:00', '2026-06-09 12:30:00', 'Atelier Céramique', 'COMPLETED', 'Modelage formes de base'),
(6, 1, '2026-06-17 09:00:00', '2026-06-17 12:00:00', 'Salle A1', 'SCHEDULED', 'Paysages et perspectives'),
(7, 2, '2026-06-18 14:00:00', '2026-06-18 17:00:00', 'Extérieur La Goulette', 'SCHEDULED', 'Photo port et lumière dorée'),
(8, 3, '2026-06-20 10:00:00', '2026-06-20 13:00:00', 'Lab Info B2', 'SCHEDULED', 'Animations et boucles'),
(9, 5, '2026-06-22 09:00:00', '2026-06-22 12:00:00', 'Atelier Céramique', 'SCHEDULED', 'Décoration motifs géométriques'),
(10, 4, '2026-06-24 09:30:00', '2026-06-24 12:30:00', 'Atelier Céramique', 'SCHEDULED', 'Sculpture portrait'),
(11, 1, '2026-06-25 09:00:00', '2026-06-25 12:00:00', 'Salle A1', 'SCHEDULED', 'Projet final aquarelle'),
(12, 3, '2026-06-27 10:00:00', '2026-06-27 13:00:00', 'Lab Info B2', 'SCHEDULED', 'Projet final génératif');

-- ============================================
-- NOTIFICATIONS
-- ============================================
INSERT INTO notification (id, user_id, title, message, is_read, created_at) VALUES
(1, 'USR_VIS01', 'Commande livrée', 'Votre commande #1 a été livrée avec succès !', true, '2026-06-04 14:30:00'),
(2, 'USR_VIS02', 'Commande livrée', 'Votre commande #2 a été livrée avec succès !', true, '2026-06-07 10:00:00'),
(3, 'USR_VIS03', 'Commande expédiée', 'Votre commande #3 est en route !', false, '2026-06-10 09:15:00'),
(4, 'USR_VIS01', 'Commande confirmée', 'Votre commande #4 est confirmée et en préparation.', false, '2026-06-12 16:00:00'),
(5, 'USR_VIS01', 'Nouvel événement', 'Le Festival des Arts Visuels est maintenant ouvert à la réservation !', false, '2026-06-20 08:00:00'),
(6, 'USR_ART01', 'Ticket acheté', 'Vous avez acheté un ticket pour Nuit de la Photographie', true, '2026-06-18 19:00:00');

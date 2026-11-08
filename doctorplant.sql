-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2026 at 02:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `doctorplant`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY` (IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255), IN `COLUMN_NAME_ARGUMENT` VARCHAR(255))   BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID INT(11);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
			AND `COLUMN_TYPE` LIKE '%int%'
			AND `COLUMN_KEY` = 'PRI';
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL AUTO_INCREMENT;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY` (IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255))   BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID TINYINT(1);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `Extra` = 'auto_increment'
			AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `CommentId` int(11) NOT NULL,
  `PostId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `Text` text DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`CommentId`, `PostId`, `UserId`, `Text`, `CreatedAt`) VALUES
(7, 17, 1, '1212', '2026-04-25 00:33:05'),
(8, 16, 7, 'I see it', '2026-04-25 15:59:03'),
(9, 14, 1, 'sdasda', '2026-04-27 12:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `contactmessages`
--

CREATE TABLE `contactmessages` (
  `Id` int(11) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(150) NOT NULL,
  `Subject` varchar(100) NOT NULL,
  `Message` longtext NOT NULL,
  `Status` longtext NOT NULL,
  `AdminReply` longtext DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `ReadAt` datetime(6) DEFAULT NULL,
  `RepliedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contactmessages`
--

INSERT INTO `contactmessages` (`Id`, `Name`, `Email`, `Subject`, `Message`, `Status`, `AdminReply`, `CreatedAt`, `ReadAt`, `RepliedAt`, `IsDeleted`) VALUES
(1, 'adam mno', 'yazanarar444@gmail.com', 'support', 'Hello, I am having an issue logging into my account. Every time I try to sign in, I get an error message saying \"Invalid credentials\" even though I am sure my password is correct. Could you please help me resolve this issue?', 'Read', 'Hello, thank you for contacting us.\nPlease make sure that you are entering the correct email and password. If the problem persists, try resetting your password using the \"Forgot Password\" option. If you still face issues, let us know and we will assist you further.', '2026-04-26 14:59:08.316785', '2026-04-26 15:11:07.530923', '2026-04-26 15:03:47.304604', 1),
(2, 'amer riad', 'yazanarar444@gmail.com', 'support', 'Hello, I am having an issue logging into my account. Every time I try to sign in, I get an error message saying \"Invalid credentials\" even though I am sure my password is correct. Could you please help me resolve this issue?', 'Replied', '12121212', '2026-04-26 15:17:22.277356', '2026-04-26 15:25:13.725152', '2026-04-26 15:26:46.930651', 1),
(3, 'Yazan Arar', 'yazan@gmail.com', 'general', 'يشيشي', 'Read', NULL, '2026-04-26 15:24:57.894969', '2026-04-26 15:25:12.642718', NULL, 1),
(4, 'Yazan Arar', 'yazanarar444@gmail.com', 'partnership', 'Hello, I am having an issue logging into my account. Every time I try to sign in, I get an error message saying \"Invalid credentials\" even though I am sure my password is correct. Could you please help me resolve this issue?', 'Replied', 'Hello, thank you for contacting us.\nPlease make sure that you are entering the correct email and password. If the problem persists, try resetting your password using the \"Forgot Password\" option. If you still face issues, let us know and we will assist you further.', '2026-04-26 15:35:50.537849', '2026-04-26 15:36:18.012998', '2026-04-26 15:36:37.108062', 0),
(5, 'adam homade', 'yazanarar101@gmail.com', 'feedback', 'this is the best website in the world', 'Replied', 'Thank You <3', '2026-04-26 15:38:39.944956', '2026-04-26 15:38:48.413992', '2026-04-26 15:44:02.184362', 0),
(6, 'Yazan Arar', 'yayza@gmail.com', 'support', 'dasdasd', 'Read', NULL, '2026-04-26 16:25:31.658637', '2026-04-26 16:25:39.015940', NULL, 1),
(7, 'Yazan Arar', 'yazanarar32@gmail.com', 'feedback', 'i like this website', 'Replied', 'thx', '2026-05-21 17:10:26.004121', '2026-05-21 17:10:54.127878', '2026-05-21 17:11:07.997026', 0),
(8, 'asasas', 'yazanarar32@gmail.com', 'support', 'sdagfagfagf', 'Replied', 'sdasd', '2026-05-23 14:01:38.544961', '2026-05-23 14:01:54.688399', '2026-05-23 14:02:11.540904', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cropdetails`
--

CREATE TABLE `cropdetails` (
  `CropDetailsId` int(11) NOT NULL,
  `CropId` int(11) NOT NULL,
  `PlantingMethodEn` longtext DEFAULT NULL,
  `PlantingMethodAr` longtext DEFAULT NULL,
  `WateringPlanEn` longtext DEFAULT NULL,
  `WateringPlanAr` longtext DEFAULT NULL,
  `SunlightEn` longtext DEFAULT NULL,
  `SunlightAr` longtext DEFAULT NULL,
  `SoilAndFertilizingEn` longtext DEFAULT NULL,
  `SoilAndFertilizingAr` longtext DEFAULT NULL,
  `AvoidMistakesEn` longtext DEFAULT NULL,
  `AvoidMistakesAr` longtext DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cropdetails`
--

INSERT INTO `cropdetails` (`CropDetailsId`, `CropId`, `PlantingMethodEn`, `PlantingMethodAr`, `WateringPlanEn`, `WateringPlanAr`, `SunlightEn`, `SunlightAr`, `SoilAndFertilizingEn`, `SoilAndFertilizingAr`, `AvoidMistakesEn`, `AvoidMistakesAr`, `CreatedAt`) VALUES
(1, 1, 'Plant certified seed potatoes in cool weather, 8-12 cm deep, with 25-35 cm spacing.', 'ازرع درنات بطاطا معتمدة في طقس معتدل بعمق 8-12 سم وبمسافة 25-35 سم.', 'Water deeply 1-2 times weekly and keep moisture even during tuber formation.', 'اسقِ بعمق 1-2 مرة أسبوعيًا وحافظ على رطوبة منتظمة خلال تكوين الدرنات.', 'Needs 6-8 hours of direct sun.', 'تحتاج 6-8 ساعات شمس مباشرة.', 'Loose, well-drained soil rich in compost; hill soil around stems and feed with balanced fertilizer.', 'تربة مفككة جيدة الصرف وغنية بالكمبوست؛ قم بتكويم التربة حول السيقان مع تسميد متوازن.', 'Waterlogging.\nSkipping hilling.\nLate harvest after foliage collapse.', 'تغدق التربة بالماء.\nإهمال التكويم.\nتأخير الحصاد بعد تدهور المجموع الخضري.', '2026-04-24 16:10:17.000000'),
(2, 2, 'Plant healthy seedlings in warm frost-free sites with 4-6 m spacing.', 'ازرع شتلات الكارامبولا في موقع دافئ خالٍ من الصقيع وبمسافة 4-6 متر.', 'Water regularly in establishment stage, then deep irrigation when topsoil dries.', 'اسقِ بانتظام في مرحلة التأسيس ثم ريّ عميق عند جفاف السطح.', 'Prefers full sun (6-8 hours).', 'تفضّل شمسًا كاملة (6-8 ساعات).', 'Well-drained fertile soil; apply organic matter and light balanced feeding during growth.', 'تربة خصبة جيدة الصرف؛ أضف مادة عضوية وتسميدًا متوازنًا خفيفًا أثناء النمو.', 'Cold exposure.\nPoor drainage.\nOver-pruning young trees.', 'التعرض للبرد.\nضعف الصرف.\nالتقليم الزائد للأشجار الصغيرة.', '2026-04-24 16:10:17.000000'),
(3, 3, 'Plant dormant apricot saplings in late winter with good airflow and spacing.', 'ازرع شتلات المشمش الساكنة أواخر الشتاء مع تهوية جيدة ومسافات مناسبة.', 'Deep watering every 7-10 days in dry periods; reduce near harvest.', 'ريّ عميق كل 7-10 أيام في فترات الجفاف مع تقليل الري قرب الحصاد.', 'Needs full sun (7-8 hours).', 'يحتاج شمسًا كاملة (7-8 ساعات).', 'Well-drained loam, pH near neutral; feed in early spring and after fruit set.', 'تربة طميية جيدة الصرف وحموضة قريبة من المتعادل؛ سمّد في بداية الربيع وبعد العقد.', 'Late frost damage.\nOverwatering roots.\nSkipping pruning.', 'أضرار الصقيع المتأخر.\nالإفراط في الري.\nإهمال التقليم.', '2026-04-24 16:10:17.000000'),
(4, 4, 'Sow soybean after soil warms above 15C at 3-5 cm depth.', 'ازرع فول الصويا بعد دفء التربة فوق 15°م بعمق 3-5 سم.', 'Moderate regular watering, especially at flowering and pod filling.', 'ريّ معتدل منتظم خاصة وقت الإزهار وامتلاء القرون.', 'Needs 6-8 hours of direct sun.', 'يحتاج 6-8 ساعات شمس مباشرة.', 'Well-drained soil; inoculate seed when needed and avoid heavy nitrogen.', 'تربة جيدة الصرف؛ يمكن تلقيح البذور بكتيريا نافعة وتجنب الإفراط بالنيتروجين.', 'Water stress at flowering.\nDense planting.\nExcess nitrogen fertilizer.', 'العطش وقت الإزهار.\nالزراعة الكثيفة.\nالإفراط في التسميد النيتروجيني.', '2026-04-24 16:10:17.000000'),
(5, 5, 'Sow directly in cool weather at 1-2 cm depth with short intervals for continuous harvest.', 'ازرع الفجل مباشرة في الجو المعتدل بعمق 1-2 سم وعلى دفعات متقاربة للحصاد المستمر.', 'Keep soil evenly moist with light frequent watering.', 'حافظ على رطوبة متوازنة بريّ خفيف متكرر.', 'Prefers 4-6 hours sun.', 'يفضل 4-6 ساعات شمس.', 'Loose fertile soil without stones; light feeding is enough.', 'تربة مفككة خصبة وخالية من الحصى؛ يكفي تسميد خفيف.', 'Irregular watering.\nOvercrowding.\nLate harvest causing pithy roots.', 'الري غير المنتظم.\nالزراعة المتزاحمة.\nتأخير الحصاد مما يسبب جذورًا ليفية.', '2026-04-24 16:10:17.000000'),
(6, 6, 'Plant grafted mango trees in warm sunny areas with wide spacing.', 'ازرع شتلات مانجو مطعمة في مكان دافئ مشمس وبمسافات واسعة.', 'Deep watering during establishment; reduce frequency for mature trees.', 'ري عميق خلال التأسيس ثم تقليل عدد الريات للأشجار البالغة.', 'Needs full sun (8+ hours).', 'تحتاج شمسًا كاملة (8+ ساعات).', 'Well-drained soil with organic matter; balanced feeding with potassium support at fruiting.', 'تربة جيدة الصرف مع مادة عضوية؛ تسميد متوازن مع دعم البوتاسيوم وقت الإثمار.', 'Waterlogging.\nCold exposure.\nHeavy pruning at wrong time.', 'تغدق التربة.\nالتعرض للبرد.\nالتقليم الشديد في توقيت غير مناسب.', '2026-04-24 16:10:17.000000'),
(7, 7, 'Sow peas directly in cool weather at 3-4 cm depth.', 'تزرع البازلاء في الجو البارد مباشرة في التربة بعمق 3-4 سم.', 'Moderate regular watering; increase during flowering.', 'ري منتظم معتدل، وتزداد الحاجة للماء وقت الإزهار.', 'Direct sun for about 5-7 hours.', 'شمس مباشرة 5-7 ساعات.', 'Well-drained soil; light feeding only and avoid high nitrogen.', 'تربة جيدة الصرف؛ تسميد خفيف فقط وتجنب النيتروجين العالي.', 'Planting in high heat.\nToo much nitrogen fertilizer.\nNo support for climbing varieties.', 'الزراعة في حرارة مرتفعة.\nالإفراط في التسميد النتروجيني.\nضعف الدعامة.', '2026-04-24 16:10:17.000000'),
(8, 8, 'Grow lemon in warm sunny sites with frost protection.', 'تزرع الليمون في مكان دافئ ومشمس مع حماية من الصقيع.', 'Deep regular watering in summer, reduced in winter; avoid standing water.', 'ري عميق منتظم صيفًا، وأقل شتاءً، مع منع ركود الماء حول الجذور.', '6-8 hours of direct sun.', '6-8 ساعات شمس مباشرة.', 'Light, well-drained soil with pH around 6-7; feed with citrus fertilizer in split doses.', 'تربة خفيفة جيدة الصرف وحموضة 6-7 تقريبًا؛ سماد حمضيات على دفعات.', 'Frost injury.\nExcess irrigation.\nPoor drainage.', 'تجمد الشتلات.\nالري المفرط.\nضعف الصرف.', '2026-04-24 16:10:17.000000'),
(9, 9, 'Grow lettuce in mild weather, shallow sowing with 20-30 cm spacing.', 'ازرع الخس في جو معتدل، بعمق خفيف ومسافة 20-30 سم.', 'Keep soil consistently moist with light, frequent watering.', 'يحافظ على أوراق طرية مع ري خفيف متكرر ومنتظم.', '4-6 hours sun; provide light shade in hot weather.', '4-6 ساعات شمس، ويفضل ظلًا خفيفًا في الحر.', 'Fertile, moisture-retentive but well-drained soil; light nitrogen-rich feeding every two weeks.', 'تربة خصبة ورطبة جيدة الصرف؛ تسميد خفيف غني بالنيتروجين كل أسبوعين.', 'High heat stress.\nAllowing soil to dry out.\nLate harvest causing bitterness.', 'تعريضه لحر شديد.\nجفاف التربة.\nتأخير الحصاد حتى المرارة.', '2026-04-24 16:10:17.000000'),
(10, 10, 'Plant orange trees in warm soil and full sun.', 'تزرع شتلات البرتقال في تربة دافئة ومكان مشمس.', 'Deep regular watering; reduce frequency in cool weather.', 'ري عميق منتظم مع تقليل الري في الأجواء الباردة.', '6-8 hours direct sun.', '6-8 ساعات شمس مباشرة.', 'Well-drained soil enriched with organic matter; apply citrus fertilizer 2-3 times yearly.', 'تربة جيدة الصرف غنية بالمادة العضوية؛ تسميد حمضيات متوازن 2-3 مرات سنويًا.', 'Constant heavy watering.\nGrowing in shade.\nSkipping hygiene pruning.', 'الري الثقيل المستمر.\nالزراعة في ظل.\nإهمال التقليم الصحي.', '2026-04-24 16:10:17.000000'),
(11, 11, 'Plant healthy runners/crowns in cool weather with crowns above soil line.', 'ازرع شتلات الفراولة السليمة في جو معتدل مع بقاء قلب النبات فوق سطح التربة.', 'Frequent light watering; keep moisture stable during flowering and fruiting.', 'ري خفيف متكرر مع ثبات الرطوبة خلال الإزهار والإثمار.', 'Needs 6-8 hours of sun.', 'تحتاج 6-8 ساعات شمس.', 'Well-drained rich soil with mulch; balanced feeding and calcium support when needed.', 'تربة خصبة جيدة الصرف مع تغطية عضوية؛ تسميد متوازن ودعم بالكالسيوم عند الحاجة.', 'Water on leaves at night.\nOvercrowding.\nPoor hygiene of old leaves.', 'بلل الأوراق ليلًا.\nالزراعة المتزاحمة.\nإهمال إزالة الأوراق القديمة.', '2026-04-24 16:10:17.000000'),
(12, 12, 'Plant guava seedlings in warm sunny sites with 4-5 m spacing.', 'ازرع شتلات الجوافة في موقع دافئ مشمس وبمسافة 4-5 متر.', 'Deep watering at intervals; increase in hot dry periods.', 'ري عميق على فترات مع زيادة الري في الحر والجفاف.', 'Prefers full sun (6-8 hours).', 'تفضّل شمسًا كاملة (6-8 ساعات).', 'Well-drained soil with organic matter; apply balanced fertilizer 2-3 times per season.', 'تربة جيدة الصرف مع مادة عضوية؛ سماد متوازن 2-3 مرات في الموسم.', 'Ignoring pruning.\nOverwatering.\nLate pest control.', 'إهمال التقليم.\nالري الزائد.\nتأخر مكافحة الآفات.', '2026-04-24 16:10:17.000000'),
(13, 13, 'Start seeds 6-8 weeks before last frost and transplant after temperatures stabilize. Plant deep with 40-60 cm spacing.', 'ابدأ البذور قبل 6-8 أسابيع من آخر صقيع ثم انقل الشتلات بعد استقرار الحرارة. ازرع بعمق مع ترك 40-60 سم بين النباتات.', 'Water deeply 2-3 times weekly with steady soil moisture. Avoid wetting leaves to reduce fungal disease.', 'اسقِ بعمق 2-3 مرات أسبوعيًا مع تثبيت الرطوبة. تجنب تبليل الأوراق لتقليل الأمراض الفطرية.', 'Needs 6-8 hours of direct sun daily.', 'تحتاج 6-8 ساعات شمس مباشرة يوميًا.', 'Well-drained loamy soil rich in compost, pH 6.0-6.8. Apply balanced fertilizer at planting, then shift to higher potassium at flowering/fruiting.', 'تربة خفيفة جيدة التصريف وغنية بالكمبوست، pH بين 6.0 و6.8. أضف سمادًا متوازنًا عند الزراعة ثم زِد البوتاسيوم عند بداية الإزهار والإثمار.', 'Irregular watering causing fruit cracking.\nExcess nitrogen that boosts leaves over fruit.\nPoor airflow around plants.', 'الري غير المنتظم الذي يسبب تشقق الثمار.\nالإفراط في النيتروجين على حساب الثمار.\nالزراعة في مكان سيئ التهوية.', '2026-04-24 16:10:17.000000'),
(14, 14, 'Transplant once temperatures are warm, spacing plants 50-60 cm.', 'ازرع الشتلات بعد ارتفاع الحرارة، واترك مسافة 50-60 سم بين النباتات.', 'Deep watering 2-3 times weekly with even moisture.', 'ري عميق 2-3 مرات أسبوعيًا مع ثبات الرطوبة.', 'Prefers 6-8 hours of direct sunlight.', 'يفضل 6-8 ساعات شمس مباشرة.', 'Rich, well-drained soil with ample organic matter. Balanced feeding every 2-3 weeks during fruiting.', 'تربة غنية جيدة الصرف مع مادة عضوية مرتفعة. تسميد متوازن كل 2-3 أسابيع خلال الإثمار.', 'Exposure to early cold.\nOverwatering.\nLetting fruits overmature before harvest.', 'البرودة المبكرة.\nالري الزائد.\nترك الثمار تكبر كثيرًا قبل القطف.', '2026-04-24 16:10:17.000000'),
(15, 15, 'Sow after soil warms (18C+) at 2-3 cm depth with 40-50 cm spacing.', 'ازرع بعد دفء التربة (18 م° فأعلى) بعمق 2-3 سم مع مسافة 40-50 سم بين النباتات.', 'Cucumber yields best with consistent moisture, about 3-4 waterings weekly in warm weather.', 'يحافظ الخيار على إنتاج جيد مع ري ثابت 3-4 مرات أسبوعيًا حسب الحرارة.', 'Requires 6-8 hours of direct sun.', 'يحتاج 6-8 ساعات شمس مباشرة.', 'Fertile, well-drained soil with high organic matter. Feed with balanced fertilizer every 2-3 weeks during growth and bloom.', 'تربة خصبة جيدة الصرف وغنية بالمادة العضوية. سماد متوازن كل 2-3 أسابيع خلال النمو والإزهار.', 'Alternating drought and overwatering.\nDense planting without airflow.\nLate harvesting that slows new fruiting.', 'تعطيش النبات ثم إغراقه بالماء.\nالزراعة الكثيفة بدون تهوية.\nتأخير القطف مما يقلل الإنتاج.', '2026-04-24 16:10:17.000000'),
(16, 16, 'Start pepper seedlings early and transplant after cool weather passes, spacing 40-50 cm.', 'ابدأ شتلات الفلفل مبكرًا وانقلها بعد زوال البرودة، مع تباعد 40-50 سم.', 'Water when top 3 cm dries, usually 2-3 times weekly.', 'ري منتظم عندما يجف أول 3 سم من التربة، عادة 2-3 مرات أسبوعيًا.', 'Needs 6-8 hours of direct sun daily.', 'يحتاج شمسًا مباشرة 6-8 ساعات يوميًا.', 'Warm, well-drained loam, pH around 6.0-6.8. Light balanced feeding, with extra potassium at fruit set.', 'تربة خفيفة دافئة جيدة الصرف، pH حوالي 6.0-6.8. جرعات خفيفة متوازنة، مع دعم البوتاسيوم وقت العقد.', 'Transplanting before soil warms.\nOverwatering roots.\nToo much shade.', 'الزراعة المبكرة قبل دفء التربة.\nالإفراط في الري.\nتظليل النبات أكثر من اللازم.', '2026-04-24 16:10:17.000000'),
(17, 17, 'Plant corn in blocks (not a single row) to improve pollination, at 3-5 cm depth.', 'ازرع الذرة في كتل (وليس صفًا واحدًا) لتحسين التلقيح، بعمق 3-5 سم.', 'Needs deep regular watering, especially at tasseling and ear fill.', 'تحتاج ريًا عميقًا منتظمًا خاصة أثناء التزهير وتعبئة الحبوب.', '8+ hours of direct sunlight.', '8 ساعات شمس مباشرة أو أكثر.', 'Deep, well-drained soil rich in organic matter. Requires staged nitrogen feeding.', 'تربة عميقة جيدة التصريف وغنية بالمواد العضوية. تحتاج تغذية جيدة بالنيتروجين على مراحل.', 'Planting in one row only.\nWater stress during flowering.\nPoor stand density.', 'الزراعة في صف واحد.\nالعطش أثناء التزهير.\nكثافة زراعة ضعيفة.', '2026-04-24 16:10:17.000000'),
(18, 18, 'Plant after warm weather arrives, in warm soil with wide spacing for vine spread.', 'تزرع بعد دفء الجو في تربة دافئة، مع مساحات واسعة للتمدد.', 'Deep regular watering early; reduce near ripening for better flavor and less cracking.', 'ري عميق منتظم في البداية، ثم خفّف قرب النضج لتحسين الطعم وتقليل التشقق.', 'Needs strong direct sunlight, around 8 hours.', 'تحتاج شمسًا مباشرة قوية 8 ساعات تقريبًا.', 'Light sandy-loam, well drained. Use balanced fertilizer early, then emphasize potassium during fruit development.', 'تربة رملية خفيفة جيدة الصرف. سماد متوازن أولًا، ثم دعم بالبوتاسيوم عند تكوين الثمار.', 'Overcrowding.\nOverwatering near ripening.\nPoor drainage.', 'الزراعة بكثافة.\nالري الزائد وقت النضج.\nسوء الصرف.', '2026-04-24 16:10:17.000000'),
(19, 19, 'Plant olive trees in very sunny locations with excellent drainage.', 'ازرع الزيتون في موقع مشمس جدًا وتربة جيدة الصرف.', 'Deep, infrequent irrigation; established olives tolerate moderate drought.', 'ري عميق متباعد؛ الزيتون يتحمل الجفاف النسبي بعد التأسيس.', '8+ hours of direct sunlight.', '8 ساعات شمس مباشرة أو أكثر.', 'Medium to light well-drained soils; avoid high salinity. Light organic/balanced feeding in spring.', 'تربة متوسطة إلى خفيفة التصريف، وتجنب الملوحة العالية. تسميد عضوي/متوازن خفيف في الربيع.', 'Overwatering.\nToo much shade.\nNeglecting pruning/maintenance.', 'الري الزائد.\nالظل.\nإهمال التقليم والصيانة.', '2026-04-24 16:10:17.000000'),
(20, 20, 'Plant pumpkin in warm soil with wide spacing since vines spread aggressively.', 'ازرع القرع في تربة دافئة ومساحة واسعة لأن النبات زاحف.', 'Deep watering 1-2 times weekly depending on heat and soil.', 'ري عميق 1-2 مرة أسبوعيًا حسب الحرارة والتربة.', '6-8 hours of direct sunlight.', '6-8 ساعات شمس مباشرة.', 'Very compost-rich, well-drained soil. Regular feeding, with higher potassium at fruit set.', 'تربة غنية جدًا بالكمبوست وجيدة الصرف. تسميد منتظم مع زيادة البوتاسيوم وقت تكوين الثمار.', 'Insufficient spacing.\nInconsistent watering.\nIgnoring pest pressure.', 'ضيق المساحة.\nالري المتذبذب.\nإهمال مراقبة الآفات.', '2026-04-24 16:10:17.000000'),
(21, 21, 'Plant grape vines in a sunny site with a strong trellis and regular pruning.', 'تزرع شتلات العنب في موقع مشمس مع تعريشة/دعامة قوية وتقليم منتظم.', 'Moderate irrigation: water deeply, then allow slight surface drying between irrigations.', 'الري معتدل؛ اسقِ بعمق ثم اترك سطح التربة يجف قليلًا بين الريات.', 'Prefers 7-8 hours of direct sun.', 'يفضل 7-8 ساعات شمس مباشرة.', 'Well-drained soil; avoid prolonged root saturation. Balanced nutrition early season; avoid excess nitrogen.', 'تربة جيدة الصرف، وتجنب الغمر حول الجذور. تسميد متوازن في بداية الموسم مع عدم المبالغة في النيتروجين.', 'Skipping pruning.\nOverirrigation.\nPoor canopy airflow.', 'إهمال التقليم.\nزيادة الري.\nضعف التهوية بين الأفرع.', '2026-04-24 16:10:17.000000'),
(22, 22, 'Transplant cauliflower seedlings in cool weather with 45-60 cm spacing.', 'ازرع شتلات القرنبيط في الجو المعتدل بمسافة 45-60 سم.', 'Keep soil steadily moist, especially during head formation.', 'حافظ على رطوبة ثابتة للتربة خاصة أثناء تكوين الرأس.', 'Needs 5-7 hours of sun.', 'يحتاج 5-7 ساعات شمس.', 'Fertile soil rich in compost; balanced feeding with boron/calcium support if deficient.', 'تربة خصبة غنية بالكمبوست؛ تسميد متوازن مع دعم البورون/الكالسيوم عند النقص.', 'Heat stress.\nWater stress.\nDelayed harvest after head loosening.', 'إجهاد الحرارة.\nعدم انتظام الري.\nتأخير الحصاد بعد تفتح الرأس.', '2026-04-24 16:10:17.000000'),
(23, 23, 'Plant pomegranate in warm sunny sites with moderate spacing.', 'ازرع الرمان في مواقع دافئة مشمسة مع مسافات مناسبة.', 'Deep watering at intervals; reduce excessive irrigation near ripening.', 'ري عميق على فترات مع تجنب زيادة الري قرب النضج.', 'Needs full sun (6-8+ hours).', 'يحتاج شمسًا كاملة (6-8+ ساعات).', 'Well-drained soil; organic matter addition and seasonal balanced fertilizer are recommended.', 'تربة جيدة الصرف؛ يوصى بإضافة مادة عضوية وتسميد متوازن موسمي.', 'Overwatering.\nIgnoring pruning/suckers.\nLate pest management.', 'الري الزائد.\nإهمال التقليم والسرطانات.\nتأخر مكافحة الآفات.', '2026-04-24 16:10:17.000000'),
(24, 24, 'Plant grafted apple saplings in winter dormancy with proper pollinator planning.', 'ازرع شتلات التفاح المطعمة في سكون الشتاء مع مراعاة وجود صنف مُلَقِّح.', 'Deep watering every 7-10 days in dry periods; avoid overwatering.', 'ري عميق كل 7-10 أيام في فترات الجفاف مع تجنب الإفراط في الري.', 'Needs full sun (7-8 hours).', 'يحتاج شمسًا كاملة (7-8 ساعات).', 'Well-drained loam with organic matter; seasonal balanced fertilization and pruning are essential.', 'تربة طميية جيدة الصرف مع مادة عضوية؛ تسميد موسمي متوازن مع تقليم دوري.', 'Poor pollination.\nOvercrowded canopy.\nSkipping disease prevention.', 'ضعف التلقيح.\nتزاحم الأفرع.\nإهمال الوقاية من الأمراض.', '2026-04-24 16:10:17.000000');

-- --------------------------------------------------------

--
-- Table structure for table `cropdiseases`
--

CREATE TABLE `cropdiseases` (
  `CropId` int(11) NOT NULL,
  `DiseaseId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cropdiseases`
--

INSERT INTO `cropdiseases` (`CropId`, `DiseaseId`) VALUES
(1, 60),
(1, 61),
(1, 82),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 82),
(3, 4),
(3, 5),
(3, 82),
(4, 22),
(4, 35),
(4, 66),
(4, 67),
(4, 68),
(4, 69),
(4, 70),
(4, 71),
(4, 72),
(4, 80),
(4, 82),
(5, 16),
(5, 64),
(5, 65),
(5, 80),
(5, 82),
(6, 6),
(6, 22),
(6, 40),
(6, 48),
(6, 49),
(6, 50),
(6, 81),
(6, 82),
(7, 16),
(7, 22),
(7, 56),
(7, 82),
(8, 6),
(8, 35),
(8, 36),
(8, 37),
(8, 38),
(8, 39),
(8, 40),
(8, 41),
(8, 82),
(9, 42),
(9, 43),
(9, 44),
(9, 45),
(9, 46),
(9, 47),
(9, 82),
(10, 53),
(10, 54),
(10, 55),
(10, 82),
(11, 73),
(11, 82),
(12, 31),
(12, 32),
(12, 33),
(12, 34),
(12, 82),
(13, 57),
(13, 60),
(13, 61),
(13, 74),
(13, 75),
(13, 76),
(13, 77),
(13, 78),
(13, 79),
(13, 82),
(14, 23),
(14, 24),
(14, 25),
(14, 26),
(14, 27),
(14, 28),
(14, 82),
(15, 16),
(15, 22),
(15, 82),
(16, 57),
(16, 82),
(17, 19),
(17, 20),
(17, 21),
(17, 82),
(18, 6),
(18, 16),
(18, 80),
(18, 82),
(19, 51),
(19, 52),
(19, 82),
(20, 16),
(20, 22),
(20, 62),
(20, 63),
(20, 82),
(21, 2),
(21, 29),
(21, 30),
(21, 82),
(22, 2),
(22, 13),
(22, 14),
(22, 15),
(22, 16),
(22, 17),
(22, 18),
(22, 82),
(23, 6),
(23, 35),
(23, 58),
(23, 59),
(23, 82),
(24, 1),
(24, 2),
(24, 3),
(24, 82);

-- --------------------------------------------------------

--
-- Table structure for table `crops`
--

CREATE TABLE `crops` (
  `CropId` int(11) NOT NULL,
  `Season` varchar(20) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `NameArabic` varchar(150) NOT NULL,
  `PlantingTimeEn` varchar(255) NOT NULL,
  `PlantingTimeAr` varchar(255) NOT NULL,
  `GrowthPeriodEn` varchar(255) NOT NULL,
  `GrowthPeriodAr` varchar(255) NOT NULL,
  `DifficultyEn` varchar(255) NOT NULL,
  `DifficultyAr` varchar(255) NOT NULL,
  `UserId` int(11) DEFAULT NULL,
  `ImageUrl` varchar(500) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `crops`
--

INSERT INTO `crops` (`CropId`, `Season`, `Name`, `NameArabic`, `PlantingTimeEn`, `PlantingTimeAr`, `GrowthPeriodEn`, `GrowthPeriodAr`, `DifficultyEn`, `DifficultyAr`, `UserId`, `ImageUrl`, `CreatedAt`) VALUES
(1, 'winter', 'Potatoes', 'البطاطس', 'November, December', 'نوفمبر، ديسمبر', '90-120 days', '90-120 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861884/Potatoes_kls7ka.webp', '2026-04-07 21:41:14'),
(2, 'winter', 'Carambola', 'الكارامبولا', 'November, December', 'نوفمبر، ديسمبر', '10-14 months', '10-14 شهراً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861820/Carambola_obpydy.jpg', '2026-04-07 21:41:14'),
(3, 'winter', 'Apricot', 'المشمش', 'November, December', 'نوفمبر، ديسمبر', '3-5 years', '3-5 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861817/Apricot_d4fyjo.jpg', '2026-04-07 21:41:14'),
(4, 'winter', 'Soybean', 'فول الصويا', 'November, December', 'نوفمبر، ديسمبر', '80-100 days', '80-100 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861888/Soybean_udgpct.jpg', '2026-04-07 21:41:14'),
(5, 'winter', 'Radishes', 'الفجل', 'December, January', 'ديسمبر، يناير', '25-35 days', '25-35 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861887/Radishes_qhjfxv.webp', '2026-04-07 21:41:14'),
(6, 'winter', 'Mango', 'المانجو', 'December, January', 'ديسمبر، يناير', '4-6 years', '4-6 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861832/Mango_tdh03k.jpg', '2026-04-07 21:41:14'),
(7, 'spring', 'Peas', 'البازلاء', 'March, April', 'مارس، أبريل', '60-70 days', '60-70 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861850/peas_eukwec.jpg', '2026-04-07 21:41:14'),
(8, 'spring', 'Lemon', 'الليمون', 'March, April', 'مارس، أبريل', '3-5 years', '3-5 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861830/Lemons_wzglfk.jpg', '2026-04-07 21:41:14'),
(9, 'spring', 'Lettuce', 'الخس', 'February, March, April', 'فبراير، مارس، أبريل', '30-45 days', '30-45 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861831/Lettuce_c21krp.jpg', '2026-04-07 21:41:14'),
(10, 'spring', 'Orange', 'البرتقال', 'March, April, May', 'مارس، أبريل، مايو', '3-4 years', '3-4 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861835/Orange_byfspn.jpg', '2026-04-07 21:41:14'),
(11, 'spring', 'Strawberries', 'الفراولة', 'February, March', 'فبراير، مارس', '60-90 days', '60-90 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861890/Strawberries_fayfea.jpg', '2026-04-07 21:41:14'),
(12, 'spring', 'Guava', 'الجوافة', 'March, April', 'مارس، أبريل', '2-3 years', '2-3 سنوات', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861828/Guava_nk8sc6.jpg', '2026-04-07 21:41:14'),
(13, 'summer', 'Tomatoes', 'الطماطم', 'May, June, July', 'مايو، يونيو، يوليو', '60-80 days', '60-80 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861891/Tomatoes_pdwzcy.jpg', '2026-04-07 21:41:14'),
(14, 'summer', 'Eggplant', 'الباذنجان', 'May, June, July', 'مايو، يونيو، يوليو', '70-85 days', '70-85 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861825/Eggplant_jpupid.jpg', '2026-04-07 21:41:14'),
(15, 'summer', 'Cucumber', 'الخيار', 'May, June, July', 'مايو، يونيو، يوليو', '50-70 days', '50-70 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861827/Cucumber_o77atj.jpg', '2026-04-07 21:41:14'),
(16, 'summer', 'Bell Peppers', 'الفلفل الحلو', 'May, June', 'مايو، يونيو', '70-90 days', '70-90 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861818/Bell_peppers_pokumz.jpg', '2026-04-07 21:41:14'),
(17, 'summer', 'Corn', 'الذرة', 'May, June', 'مايو، يونيو', '60-100 days', '60-100 يوماً', 'Easy', 'سهل', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861824/Corn_s1rm8d.jpg', '2026-04-07 21:41:14'),
(18, 'summer', 'Watermelon', 'البطيخ', 'May, June, July', 'مايو، يونيو، يوليو', '80-100 days', '80-100 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1777040943/Watermelon_qiat2u.jpg', '2026-04-07 21:41:14'),
(19, 'autumn', 'Olive', 'الزيتون', 'October, November', 'أكتوبر، نوفمبر', '3-5 years', '3-5 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861834/Olive_mk7uc1.jpg', '2026-04-07 21:41:14'),
(20, 'autumn', 'Pumpkin', 'اليقطين', 'August, September', 'أغسطس، سبتمبر', '90-120 days', '90-120 يوماً', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861886/Pumpkin_cw2tzd.jpg', '2026-04-07 21:41:14'),
(21, 'autumn', 'Grapes', 'العنب', 'August, September', 'أغسطس، سبتمبر', '2-3 years', '2-3 سنوات', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861827/Grapes_zir53g.jpg', '2026-04-07 21:41:14'),
(22, 'autumn', 'Cauliflower', 'القرنبيط', 'September, October', 'سبتمبر، أكتوبر', '55-80 days', '55-80 يوماً', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861821/Cauliflower_xuqvod.jpg', '2026-04-07 21:41:14'),
(23, 'autumn', 'Pomegranate', 'الرمان', 'August, September', 'أغسطس، سبتمبر', '3-4 years', '3-4 سنوات', 'Medium', 'متوسط', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861884/Pomegranate_crllli.jpg', '2026-04-07 21:41:14'),
(24, 'autumn', 'Apples', 'التفاح', 'August, September', 'أغسطس، سبتمبر', '4-6 years', '4-6 سنوات', 'Hard', 'صعب', 1, 'https://res.cloudinary.com/dbwncwexj/image/upload/v1776861818/Apples_zutyjr.jpg', '2026-04-07 21:41:14');

-- --------------------------------------------------------

--
-- Table structure for table `diseases`
--

CREATE TABLE `diseases` (
  `DiseaseId` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `NameAr` varchar(255) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `DescriptionAr` text DEFAULT NULL,
  `Symptoms` text DEFAULT NULL,
  `SymptomsAr` text DEFAULT NULL,
  `Treatment` text DEFAULT NULL,
  `TreatmentAr` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diseases`
--

INSERT INTO `diseases` (`DiseaseId`, `Name`, `NameAr`, `Description`, `DescriptionAr`, `Symptoms`, `SymptomsAr`, `Treatment`, `TreatmentAr`) VALUES
(1, 'Apple Scab', 'مرض جرب التفاح', 'A fungal disease of apple caused by Venturia inaequalis that infects young leaves and fruit during cool wet weather.', 'مرض فطري يصيب التفاح تسببه Venturia inaequalis ويظهر غالباً مع الجو البارد والرطب.', 'Olive-brown velvety spots on leaves, cracked scabby fruit lesions, early leaf drop.', 'بقع زيتونية بنية مخملية على الأوراق، تشققات وقشور على الثمار، وتساقط مبكر للأوراق.', 'Remove fallen leaves, prune for air flow, use resistant cultivars, and apply labeled protectant fungicides during wet periods.', 'إزالة الأوراق المتساقطة، التقليم لزيادة التهوية، زراعة أصناف مقاومة، واستخدام مبيدات فطرية وقائية مسجلة عند الرطوبة.'),
(2, 'Black Rot', 'مرض العفن الأسود', 'A fungal disease that attacks fruit, leaves, and branches, commonly associated with dead wood and old cankers.', 'مرض فطري يصيب الثمار والأوراق والأفرع وغالباً يرتبط بالأخشاب الميتة والتقرحات القديمة.', 'Circular leaf spots with dark margins, black rotted fruit, cankers on twigs or branches.', 'بقع دائرية على الأوراق بحواف داكنة، تعفن أسود في الثمار، وتقرحات على الأفرع.', 'Prune and destroy infected wood and mummified fruit, improve sanitation, and apply recommended fungicides when risk is high.', 'تقليم وحرق الأفرع والثمار المصابة، تحسين النظافة الزراعية، ورش مبيدات فطرية موصى بها عند ارتفاع خطر الإصابة.'),
(3, 'Cedar Apple Rust', 'مرض صدأ التفاح الأرزّي', 'A rust fungus disease that alternates between apple and juniper or cedar hosts.', 'مرض صدأ فطري يحتاج غالباً إلى عائلين هما التفاح والعرعر أو الأرز.', 'Bright orange leaf spots, yellow halos, fruit spots, and orange spore structures on leaf undersides.', 'بقع برتقالية لامعة على الأوراق، هالات صفراء، بقع على الثمار، وتراكيب بوغية برتقالية أسفل الورقة.', 'Remove nearby infected junipers if possible, plant resistant apples, and use preventive fungicides before and during early infection periods.', 'إزالة نباتات العرعر المصابة القريبة إن أمكن، زراعة أصناف مقاومة، واستخدام مبيدات وقائية قبل وأثناء بداية العدوى.'),
(4, 'Blight Leaf Disease', 'مرض لفحة الأوراق', 'A leaf blight condition where pathogens rapidly kill leaf tissue, especially under humid conditions.', 'مرض لفحة أوراق يسبب موتاً سريعاً لأنسجة الورقة خصوصاً في الأجواء الرطبة.', 'Large brown dead areas, yellowing around lesions, leaf curling, and premature defoliation.', 'مساحات بنية ميتة كبيرة، اصفرار حول البقع، التفاف الأوراق، وتساقطها مبكراً.', 'Remove infected leaves, avoid overhead irrigation, increase spacing, and use suitable fungicide or bactericide according to the cause.', 'إزالة الأوراق المصابة، تجنب الري بالرش، زيادة المسافات والتهوية، واستخدام مبيد فطري أو بكتيري مناسب حسب السبب.'),
(5, 'Shot Hole', 'مرض الثقوب الطلقية', 'A disease, often fungal or bacterial, causing small lesions that fall out and leave holes in leaves.', 'مرض قد يكون فطرياً أو بكتيرياً يسبب بقعاً صغيرة تسقط من الورقة وتترك ثقوباً.', 'Small purple or brown spots that drop out, ragged leaves, twig lesions, and reduced vigor.', 'بقع صغيرة أرجوانية أو بنية تسقط لاحقاً، أوراق مثقبة، إصابات على الأفرع، وضعف نمو النبات.', 'Collect diseased leaves, prune infected shoots, avoid wet foliage, and apply copper or labeled fungicides during dormancy or early growth.', 'جمع الأوراق المصابة، تقليم الأفرع المصابة، تجنب بلل الأوراق، واستخدام النحاس أو مبيد مسجل في السكون أو بداية النمو.'),
(6, 'Anthracnose', 'مرض الأنثراكنوز', 'A group of fungal diseases that cause sunken lesions on leaves, stems, flowers, or fruit.', 'مجموعة أمراض فطرية تسبب بقعاً غائرة على الأوراق والسيقان والأزهار أو الثمار.', 'Dark sunken spots, leaf blight, twig dieback, fruit rot, and pink or orange spore masses in wet weather.', 'بقع داكنة غائرة، لفحة أوراق، موت أطراف، تعفن ثمار، وكتل بوغية وردية أو برتقالية مع الرطوبة.', 'Prune infected tissue, remove plant debris, improve air movement, and apply labeled fungicides before rainy periods.', 'تقليم الأنسجة المصابة، إزالة المخلفات، تحسين التهوية، ورش مبيدات فطرية مسجلة قبل فترات المطر.'),
(7, 'Bed Bugs Disease', 'مرض بقّ الفراش', 'Damage caused by bed bug-like sucking insects feeding on plant tissues or fruits in some crops.', 'ضرر ناتج عن حشرات ماصة تشبه بق الفراش تتغذى على أنسجة النبات أو الثمار في بعض المحاصيل.', 'Small feeding punctures, yellow speckling, distorted tissues, reduced quality, and possible secondary infection.', 'نقاط تغذية صغيرة، تبقع أصفر، تشوه الأنسجة، انخفاض جودة المحصول، واحتمال عدوى ثانوية.', 'Monitor plants, remove weeds and hiding places, use insect-proof sanitation, and apply selective insecticides only when needed.', 'مراقبة النباتات، إزالة الأعشاب وأماكن الاختباء، تحسين النظافة، واستخدام مبيدات حشرية انتقائية عند الحاجة فقط.'),
(8, 'Early Blight Disease', 'مرض اللفحة المبكرة', 'A fungal disease mainly caused by Alternaria species that affects older leaves and sometimes stems and fruit.', 'مرض فطري غالباً تسببه أنواع Alternaria ويصيب الأوراق القديمة وأحياناً السيقان والثمار.', 'Brown spots with concentric rings, yellowing leaves, stem lesions, and fruit spots near the stem end.', 'بقع بنية بحلقات متداخلة، اصفرار الأوراق، بقع على الساق، وإصابات على الثمار قرب العنق.', 'Rotate crops, remove infected debris, mulch to reduce soil splash, and apply preventive fungicides when conditions favor disease.', 'اتباع دورة زراعية، إزالة المخلفات المصابة، استخدام الملش لتقليل رذاذ التربة، ورش مبيد وقائي عند ملاءمة الظروف.'),
(9, 'Fruit Borer Disease', 'مرض حفّار الثمار', 'Damage caused by larvae boring into fruits, making them unmarketable and prone to rot.', 'ضرر تسببه يرقات تحفر داخل الثمار فتجعلها غير صالحة للتسويق وأكثر عرضة للتعفن.', 'Entry holes, frass near holes, internal feeding tunnels, fruit drop, and secondary rotting.', 'ثقوب دخول، فضلات حشرية قرب الثقوب، أنفاق داخلية، تساقط الثمار، وتعفن ثانوي.', 'Remove infested fruit, use pheromone traps, bag fruits where practical, conserve natural enemies, and apply timed insecticides.', 'إزالة الثمار المصابة، استخدام مصائد فرمونية، تغليف الثمار عند الإمكان، حماية الأعداء الحيوية، والرش في التوقيت المناسب.'),
(10, 'Hooded Hopper Insect Disease', 'مرض حشرة النطاط المقنّع', 'Injury caused by sap-sucking leafhoppers that weaken plants and may transmit pathogens.', 'ضرر ناتج عن نطاطات ماصة للعصارة تضعف النبات وقد تنقل مسببات مرضية.', 'Leaf yellowing, curling, stippling, sticky honeydew, poor growth, and hopper insects on leaf undersides.', 'اصفرار والتفاف الأوراق، تنقيط خفيف، إفرازات عسلية، ضعف نمو، ووجود الحشرات أسفل الورقة.', 'Control weeds, monitor with traps, encourage predators, and use systemic or contact insecticides according to threshold.', 'مكافحة الأعشاب، المراقبة بالمصائد، تشجيع المفترسات، واستخدام مبيد جهازي أو بالملامسة حسب شدة الإصابة.'),
(11, 'Leaf Insect Pest Disease', 'مرض آفات حشرات الأوراق', 'General leaf damage caused by chewing or sucking insects that reduce photosynthesis.', 'ضرر عام للأوراق بسبب حشرات قارضة أو ماصة يقلل قدرة النبات على البناء الضوئي.', 'Holes, skeletonized leaves, yellow speckles, curled leaves, frass, and visible larvae or insects.', 'ثقوب، تعرية نصل الورقة، تنقيط أصفر، التفاف الأوراق، فضلات حشرية، ووجود يرقات أو حشرات.', 'Handpick when light, remove weeds, use nets or traps, release beneficial insects, and apply targeted insecticides if needed.', 'الجمع اليدوي عند الإصابة الخفيفة، إزالة الأعشاب، استخدام الشبك أو المصائد، دعم الأعداء الحيوية، والرش الموجه عند الحاجة.'),
(12, 'Stem Borer Disease', 'مرض حفّار الساق', 'Insect larval damage in which borers tunnel inside stems and disrupt water and nutrient flow.', 'ضرر يرقات حشرية تحفر داخل الساق وتعيق انتقال الماء والغذاء.', 'Wilting shoots, holes in stems, frass, weak stems, lodging, and dead growing tips.', 'ذبول الأفرع، ثقوب في الساق، فضلات حشرية، ضعف الساق، رقاد النبات، وموت القمم النامية.', 'Remove and destroy bored stems, rotate crops, use pheromone traps, and apply insecticides before larvae enter stems.', 'إزالة وحرق السيقان المصابة، اتباع دورة زراعية، استخدام مصائد فرمونية، والرش قبل دخول اليرقات إلى الساق.'),
(13, 'Alternaria Leaf Spot', 'مرض تبقع أوراق الألترناريا', 'A fungal leaf spot disease caused by Alternaria species, common in warm humid conditions.', 'مرض بقع ورقية فطري تسببه أنواع Alternaria ويكثر في الجو الدافئ الرطب.', 'Round brown to black spots with concentric rings, yellow halos, leaf blight, and defoliation.', 'بقع دائرية بنية إلى سوداء بحلقات متداخلة، هالات صفراء، لفحة، وتساقط الأوراق.', 'Use clean seed, remove crop residue, avoid overhead irrigation, rotate crops, and apply labeled fungicides.', 'استخدام بذور سليمة، إزالة بقايا المحصول، تجنب الري بالرش، تدوير المحاصيل، واستخدام مبيدات فطرية مسجلة.'),
(14, 'Bacterial Spot Rot', 'مرض العفن البقعي البكتيري', 'A bacterial disease causing water-soaked spots and rotting on leaves, stems, or fruit.', 'مرض بكتيري يسبب بقعاً مائية وتعفناً على الأوراق أو السيقان أو الثمار.', 'Water-soaked spots, greasy lesions, soft rot, fruit cracking, and bacterial ooze in wet weather.', 'بقع مائية، آفات دهنية، تعفن طري، تشقق الثمار، وإفراز بكتيري مع الرطوبة.', 'Use disease-free seed, avoid working wet plants, improve drainage, remove infected tissue, and apply copper-based bactericides.', 'استخدام بذور خالية من المرض، تجنب ملامسة النباتات وهي مبللة، تحسين الصرف، إزالة الأجزاء المصابة، ورش مركبات النحاس.'),
(15, 'Cabbage Aphid Colony', 'مرض مستعمرة منّ الملفوف', 'Infestation by grey-green aphids that form dense colonies on brassica leaves and heads.', 'إصابة بحشرات المن الرمادية الخضراء التي تكون مستعمرات كثيفة على أوراق ورؤوس الكرنب.', 'Curled leaves, sticky honeydew, sooty mold, stunted plants, and clusters of aphids on new growth.', 'التفاف الأوراق، إفرازات عسلية، عفن هبابي، تقزم النبات، وتجمعات من المن على النموات الحديثة.', 'Encourage lady beetles and lacewings, wash colonies off, remove weeds, and use insecticidal soap or selective aphicides.', 'تشجيع الدعسوقة وأسد المن، غسل المستعمرات، إزالة الأعشاب، واستخدام صابون حشري أو مبيد من انتقائي.'),
(16, 'Downy Mildew', 'مرض البياض الزغبي', 'An oomycete disease that develops under cool moist conditions and affects leaves and stems.', 'مرض شبيه بالفطريات يتطور في الجو البارد الرطب ويصيب الأوراق والسيقان.', 'Yellow angular leaf spots, grey or white downy growth underneath, leaf collapse, and reduced yield.', 'بقع صفراء زاوية، نمو زغبي رمادي أو أبيض أسفل الورقة، انهيار الأوراق، وانخفاض المحصول.', 'Improve ventilation, avoid overhead irrigation, remove infected leaves, rotate crops, and use labeled downy mildew fungicides.', 'تحسين التهوية، تجنب الري بالرش، إزالة الأوراق المصابة، اتباع دورة زراعية، واستخدام مبيدات مخصصة للبياض الزغبي.'),
(17, 'Club Root', 'مرض تضخم الجذور', 'A soilborne disease of brassicas caused by Plasmodiophora brassicae that deforms roots.', 'مرض تربة يصيب العائلة الصليبية تسببه Plasmodiophora brassicae ويشوه الجذور.', 'Swollen club-shaped roots, wilting in heat, stunting, yellowing, and poor head formation.', 'تضخم الجذور بشكل صولجاني، ذبول وقت الحر، تقزم، اصفرار، وضعف تكوين الرؤوس.', 'Use long crop rotation, raise soil pH with lime if appropriate, improve drainage, and plant resistant varieties.', 'اتباع دورة زراعية طويلة، رفع pH التربة بالجير عند الحاجة، تحسين الصرف، وزراعة أصناف مقاومة.'),
(18, 'Ring Spot', 'مرض التبقع الحلقي', 'A fungal or viral leaf disease recognized by circular ring-like spots on foliage.', 'مرض ورقي فطري أو فيروسي يتميز ببقع دائرية حلقية على الأوراق.', 'Circular grey or brown spots with dark rings, yellowing, leaf drop, and reduced plant vigor.', 'بقع دائرية رمادية أو بنية بحلقات داكنة، اصفرار، تساقط أوراق، وضعف عام.', 'Remove infected leaves, avoid leaf wetness, control vectors if viral, and apply fungicides when fungal diagnosis is confirmed.', 'إزالة الأوراق المصابة، تقليل بلل الأوراق، مكافحة النواقل إذا كان فيروسياً، ورش مبيد فطري عند تأكيد السبب الفطري.'),
(19, 'Cercospora Leaf Spot', 'مرض تبقع أوراق السيركوسبورا', 'A fungal disease caused by Cercospora species that creates many small leaf spots.', 'مرض فطري تسببه أنواع Cercospora ويظهر كبقع صغيرة عديدة على الأوراق.', 'Small tan or grey spots with reddish-brown margins, yellowing, leaf drying, and defoliation.', 'بقع صغيرة بنية فاتحة أو رمادية بحواف حمراء بنية، اصفرار، جفاف، وتساقط الأوراق.', 'Rotate crops, remove debris, use resistant varieties, avoid overhead watering, and apply fungicides early.', 'اتباع دورة زراعية، إزالة المخلفات، استخدام أصناف مقاومة، تجنب الري بالرش، والرش المبكر بمبيد فطري.'),
(20, 'Common Rust', 'مرض الصدأ الشائع', 'A fungal rust disease producing powdery pustules mainly on leaves.', 'مرض صدأ فطري ينتج بثرات مسحوقية غالباً على الأوراق.', 'Orange to brown pustules, chlorotic spots, leaf drying, and reduced photosynthesis.', 'بثرات برتقالية إلى بنية، بقع صفراء، جفاف الأوراق، وانخفاض البناء الضوئي.', 'Plant resistant hybrids, remove volunteer plants, monitor early, and apply fungicides when rust appears before flowering.', 'زراعة هجن مقاومة، إزالة النباتات المتطوعة، المراقبة المبكرة، ورش مبيد فطري إذا ظهر الصدأ قبل الإزهار.'),
(21, 'Northern Leaf Blight', 'مرض اللفحة الشمالية للأوراق', 'A fungal corn disease caused by Exserohilum turcicum, favored by humid weather.', 'مرض فطري في الذرة تسببه Exserohilum turcicum وينتشر مع الرطوبة.', 'Long cigar-shaped grey-green to tan lesions, leaf blight, and yield loss.', 'بقع طويلة تشبه السيجار لونها رمادي أخضر إلى بني فاتح، لفحة أوراق، ونقص في الإنتاج.', 'Use resistant hybrids, bury or remove residue, rotate crops, and apply fungicides on susceptible crops at early lesion development.', 'استخدام هجن مقاومة، دفن أو إزالة البقايا، تدوير المحصول، ورش مبيد فطري عند بداية ظهور البقع.'),
(22, 'Powdery Mildew', 'مرض البياض الدقيقي', 'A fungal disease that grows as white powdery colonies on plant surfaces.', 'مرض فطري يظهر كنمو أبيض دقيقي على سطح النبات.', 'White powdery patches, leaf curling, yellowing, reduced growth, and premature leaf drop.', 'بقع بيضاء دقيقية، التفاف الأوراق، اصفرار، ضعف النمو، وتساقط مبكر.', 'Improve air circulation, avoid excess nitrogen, remove infected leaves, and use sulfur or labeled fungicides.', 'تحسين التهوية، تجنب زيادة النيتروجين، إزالة الأوراق المصابة، واستخدام الكبريت أو مبيدات فطرية مسجلة.'),
(23, 'Insect Pest Disease', 'مرض الآفات الحشرية', 'Plant injury caused by insect pests feeding on leaves, stems, roots, or fruit.', 'ضرر نباتي ناتج عن حشرات تتغذى على الأوراق أو السيقان أو الجذور أو الثمار.', 'Chewed leaves, sap-sucking marks, wilting, holes, frass, distorted growth, or visible insects.', 'أوراق مقروضة، آثار امتصاص، ذبول، ثقوب، فضلات حشرية، نمو مشوه، أو ظهور الحشرات.', 'Identify the pest, monitor thresholds, remove heavily infested parts, use biological control, and apply suitable pesticides responsibly.', 'تحديد نوع الآفة، مراقبة حد الضرر، إزالة الأجزاء الشديدة الإصابة، استخدام المكافحة الحيوية، والرش المسؤول بمبيد مناسب.'),
(24, 'Leaf Spot Disease', 'مرض تبقع الأوراق', 'A general disease causing localized spots on leaves from fungal, bacterial, or environmental causes.', 'مرض عام يسبب بقعاً محددة على الأوراق نتيجة فطريات أو بكتيريا أو عوامل بيئية.', 'Brown, black, or yellow spots, halos, tissue death, leaf yellowing, and defoliation.', 'بقع بنية أو سوداء أو صفراء، هالات، موت نسيج، اصفرار وتساقط الأوراق.', 'Remove infected foliage, reduce humidity, water at soil level, improve spacing, and treat based on confirmed cause.', 'إزالة الأوراق المصابة، تقليل الرطوبة، الري عند مستوى التربة، تحسين المسافات، والمعالجة حسب السبب المؤكد.'),
(25, 'Mosaic Virus Disease', 'مرض فيروس الموزاييك', 'A viral disease that disrupts leaf color and growth in many crops.', 'مرض فيروسي يسبب تداخل ألوان الأوراق واضطراب النمو في محاصيل كثيرة.', 'Mottled light and dark green leaves, distortion, stunting, reduced flowering, and poor yield.', 'تبرقش أخضر فاتح وداكن، تشوه الأوراق، تقزم، قلة الإزهار، وضعف الإنتاج.', 'Remove infected plants, control aphids or other vectors, disinfect tools, and use certified virus-free seed or transplants.', 'إزالة النباتات المصابة، مكافحة المن أو النواقل، تعقيم الأدوات، واستخدام بذور أو شتلات معتمدة خالية من الفيروس.'),
(26, 'Small Leaf Disease', 'مرض صغر الأوراق', 'A disorder or disease complex causing abnormally small leaves due to pathogens, nutrient issues, or vectors.', 'مرض أو اضطراب مركب يسبب صغر حجم الأوراق بسبب مسببات مرضية أو نقص غذائي أو نواقل.', 'Small narrow leaves, shortened internodes, yellowing, stunting, and poor fruiting.', 'أوراق صغيرة وضيقة، قصر السلاميات، اصفرار، تقزم، وضعف الإثمار.', 'Test soil and tissue nutrients, control insect vectors, remove infected plants, and improve balanced fertilization.', 'فحص التربة والأنسجة غذائياً، مكافحة النواقل الحشرية، إزالة النباتات المصابة، وتحسين التسميد المتوازن.'),
(27, 'White Mold Disease', 'مرض العفن الأبيض', 'A fungal disease caused by Sclerotinia species that produces white cottony growth and hard sclerotia.', 'مرض فطري تسببه أنواع Sclerotinia ويظهر كنمو قطني أبيض وأجسام حجرية سوداء.', 'Water-soaked lesions, white fluffy mold, stem rot, wilting, and black sclerotia inside stems.', 'بقع مائية، عفن أبيض قطني، تعفن الساق، ذبول، وأجسام حجرية سوداء داخل الساق.', 'Rotate with non-hosts, reduce canopy humidity, avoid excess nitrogen, remove infected plants, and use labeled fungicides at flowering.', 'التدوير بمحاصيل غير عائلة، تقليل رطوبة المجموع الخضري، تجنب زيادة النيتروجين، إزالة المصاب، والرش وقت الإزهار بمبيد مسجل.'),
(28, 'Wilt Disease', 'مرض الذبول', 'A disease complex where vascular infection or root damage blocks water movement in the plant.', 'مرض مركب يحدث عند انسداد الأوعية أو تلف الجذور مما يمنع انتقال الماء.', 'Sudden or gradual wilting, yellowing, vascular browning, stunting, and plant death.', 'ذبول مفاجئ أو تدريجي، اصفرار، تلون بني بالأوعية، تقزم، وموت النبات.', 'Use resistant varieties, rotate crops, improve drainage, avoid root injury, and remove infected plants.', 'زراعة أصناف مقاومة، اتباع دورة زراعية، تحسين الصرف، تجنب جرح الجذور، وإزالة النباتات المصابة.'),
(29, 'Esca (Black Measles)', 'مرض الإيسكا (الحصبة السوداء)', 'A grapevine trunk disease complex caused by wood-inhabiting fungi that degrade vascular tissue.', 'مرض معقد في جذع العنب تسببه فطريات تعيش في الخشب وتضعف الأنسجة الوعائية.', 'Tiger-stripe leaf patterns, berry black spots, dieback, reduced vigor, and sudden vine collapse.', 'نقوش مخططة على الأوراق، بقع سوداء على الحبات، موت أفرع، ضعف نمو، وانهيار مفاجئ للكرمة.', 'Prune during dry weather, protect pruning wounds, remove dead wood, avoid vine stress, and replace severely affected vines.', 'التقليم في الجو الجاف، حماية جروح التقليم، إزالة الخشب الميت، تقليل الإجهاد، واستبدال الكرمات الشديدة الإصابة.'),
(30, 'Leaf Blight (Isariopsis Leaf Spot)', 'مرض لفحة الأوراق (تبقع إيزاريوپسس)', 'A grape leaf disease caused by Pseudocercospora vitis, producing angular brown lesions.', 'مرض يصيب أوراق العنب تسببه Pseudocercospora vitis ويشكل بقعاً بنية زاوية.', 'Brown angular spots, dark fungal growth on undersides, yellowing, leaf drying, and defoliation.', 'بقع بنية زاوية، نمو فطري داكن أسفل الورقة، اصفرار، جفاف، وتساقط الأوراق.', 'Remove infected leaves, prune for air flow, reduce humidity, and apply recommended grape fungicides.', 'إزالة الأوراق المصابة، التقليم للتهوية، تقليل الرطوبة، واستخدام مبيدات فطرية موصى بها للعنب.'),
(31, 'Canker', 'مرض التقرح', 'A localized dead area on bark or stems caused by fungi, bacteria, or injury.', 'منطقة ميتة موضعية على القلف أو الساق سببها فطريات أو بكتيريا أو جروح.', 'Sunken bark lesions, cracking, gum or sap ooze, branch dieback, and weak growth.', 'تقرحات غائرة في القلف، تشقق، خروج صمغ أو عصارة، موت أفرع، وضعف النمو.', 'Prune below the canker, disinfect tools, avoid injuries, improve tree vigor, and apply protectants where recommended.', 'التقليم أسفل التقرح، تعقيم الأدوات، تجنب الجروح، تحسين قوة النبات، واستخدام مواد وقائية عند التوصية.'),
(32, 'Dot', 'مرض التبقع النقطي', 'A minor spotted disease or blemish characterized by small dark dots on leaves or fruit.', 'مرض أو عيب بقعي بسيط يتميز بنقاط داكنة صغيرة على الأوراق أو الثمار.', 'Tiny black or brown dots, slight yellowing, superficial blemishes, and reduced market quality.', 'نقاط سوداء أو بنية صغيرة، اصفرار خفيف، عيوب سطحية، وانخفاض الجودة التسويقية.', 'Improve sanitation, remove infected debris, avoid prolonged wetness, and apply preventive fungicides if the spots spread.', 'تحسين النظافة الزراعية، إزالة المخلفات المصابة، تجنب البلل الطويل، واستخدام مبيد وقائي إذا انتشرت النقاط.'),
(33, 'Mummification', 'مرض تحنط الثمار', 'A fruit disease condition where infected fruit dries, shrivels, and remains attached or falls as a mummy.', 'حالة مرضية في الثمار حيث تجف الثمرة المصابة وتنكمش وتبقى معلقة أو تسقط كثمرة محنطة.', 'Shriveled dry fruit, brown rot, fungal spores, fruit drop, and carryover infection for next season.', 'ثمار جافة منكمشة، تعفن بني، أبواغ فطرية، تساقط ثمار، وبقاء مصدر عدوى للموسم التالي.', 'Collect and destroy mummified fruit, prune infected twigs, improve air flow, and spray fungicides during bloom and fruit development.', 'جمع وإتلاف الثمار المحنطة، تقليم الأفرع المصابة، تحسين التهوية، والرش أثناء الإزهار ونمو الثمار.'),
(34, 'Rust', 'مرض الصدأ', 'A fungal disease producing rusty orange, yellow, or brown pustules on leaves and stems.', 'مرض فطري يسبب بثرات صدئية برتقالية أو صفراء أو بنية على الأوراق والسيقان.', 'Powdery rust pustules, yellow leaf spots, premature leaf drop, and reduced vigor.', 'بثرات صدئية مسحوقية، بقع صفراء، تساقط مبكر للأوراق، وضعف عام.', 'Plant resistant varieties, remove alternate hosts where relevant, avoid overhead irrigation, and apply rust fungicides early.', 'زراعة أصناف مقاومة، إزالة العوائل البديلة عند الحاجة، تجنب الري بالرش، والرش المبكر بمبيدات الصدأ.'),
(35, 'Bacterial Blight', 'مرض اللفحة البكتيرية', 'A bacterial disease that kills leaf and stem tissue, often spreading by rain splash and tools.', 'مرض بكتيري يميت أنسجة الأوراق والسيقان وينتشر غالباً برذاذ المطر والأدوات.', 'Water-soaked angular spots, brown blighting, yellow halos, stem lesions, and wilting shoots.', 'بقع زاوية مائية، لفحة بنية، هالات صفراء، إصابات على الساق، وذبول نموات.', 'Use clean seed, avoid overhead irrigation, sanitize tools, remove infected plants, and apply copper products preventively.', 'استخدام بذور سليمة، تجنب الري بالرش، تعقيم الأدوات، إزالة المصاب، واستخدام مركبات النحاس وقائياً.'),
(36, 'Citrus Canker', 'مرض تقرح الحمضيات', 'A highly contagious bacterial citrus disease caused by Xanthomonas citri.', 'مرض بكتيري شديد العدوى يصيب الحمضيات وتسببه Xanthomonas citri.', 'Raised corky lesions with yellow halos on leaves, fruit, and twigs, defoliation, and fruit drop.', 'بقع فلينية مرتفعة بهالات صفراء على الأوراق والثمار والأفرع، تساقط أوراق وثمار.', 'Plant disease-free stock, remove infected shoots, disinfect tools, control wind-driven spread, and apply copper sprays.', 'زراعة شتلات سليمة، إزالة الأفرع المصابة، تعقيم الأدوات، تقليل الانتشار بالرياح، ورش النحاس.'),
(37, 'Curl Virus', 'مرض تجعد الفيروس', 'A viral disease causing leaf curling and plant stunting, commonly spread by whiteflies or aphids.', 'مرض فيروسي يسبب التفاف الأوراق وتقزم النبات وينتقل غالباً بالذبابة البيضاء أو المن.', 'Upward or downward leaf curling, yellowing, thickened leaves, stunting, and poor fruit set.', 'التفاف الأوراق للأعلى أو الأسفل، اصفرار، سماكة الأوراق، تقزم، وضعف عقد الثمار.', 'Remove infected plants, control vectors, use insect-proof nets, plant resistant varieties, and eliminate weed hosts.', 'إزالة النباتات المصابة، مكافحة النواقل، استخدام الشباك الحشرية، زراعة أصناف مقاومة، وإزالة الأعشاب العائلة.'),
(38, 'Deficiency Leaf', 'مرض نقص العناصر في الأوراق', 'A nutritional disorder where leaves show abnormal color or shape due to lack of essential nutrients.', 'اضطراب غذائي تظهر فيه الأوراق بلون أو شكل غير طبيعي بسبب نقص العناصر الأساسية.', 'Chlorosis, interveinal yellowing, marginal burn, small leaves, weak growth, and poor yield.', 'اصفرار، اصفرار بين العروق، احتراق الحواف، صغر الأوراق، ضعف النمو، وقلة الإنتاج.', 'Test soil and leaves, correct pH, apply the deficient nutrient, improve irrigation, and avoid over-fertilization imbalance.', 'تحليل التربة والأوراق، تعديل pH، إضافة العنصر الناقص، تحسين الري، وتجنب اختلال التسميد.'),
(39, 'Dry Leaf', 'مرض جفاف الأوراق', 'A physiological or disease-related condition where leaves dry due to stress, infection, or root problems.', 'حالة فسيولوجية أو مرضية تجف فيها الأوراق بسبب الإجهاد أو العدوى أو مشاكل الجذور.', 'Leaf tip burn, brittle dry leaves, browning margins, wilting, and reduced growth.', 'احتراق أطراف الأوراق، أوراق جافة هشة، اسمرار الحواف، ذبول، وضعف النمو.', 'Check irrigation and drainage, reduce heat or salt stress, remove diseased leaves, and treat root or foliar pathogens if confirmed.', 'فحص الري والصرف، تقليل إجهاد الحرارة أو الملوحة، إزالة الأوراق المصابة، ومعالجة أمراض الجذور أو الأوراق عند تأكيدها.'),
(40, 'Sooty Mould', 'مرض العفن السخامي', 'A black fungal growth that develops on honeydew secreted by sap-sucking insects.', 'نمو فطري أسود يتكون على الإفرازات العسلية التي تفرزها الحشرات الماصة.', 'Black coating on leaves or fruit, sticky surfaces, reduced photosynthesis, and presence of aphids, scales, or whiteflies.', 'طبقة سوداء على الأوراق أو الثمار، سطح لزج، انخفاض البناء الضوئي، ووجود من أو حشرات قشرية أو ذباب أبيض.', 'Control honeydew-producing insects, wash foliage, prune dense canopies, and avoid unnecessary fungicide because the main cause is insects.', 'مكافحة الحشرات المفرزة للعسل، غسل الأوراق، تقليم الكثافة، وتجنب المبيد الفطري غير الضروري لأن السبب الأساسي حشري.'),
(41, 'Spider Mites', 'مرض العناكب الحمراء', 'Tiny mite pests that feed on leaf cells and multiply quickly in hot dry conditions.', 'آفات حلمية صغيرة تتغذى على خلايا الورقة وتتكاثر بسرعة في الجو الحار الجاف.', 'Fine stippling, bronzed leaves, webbing, leaf drop, and tiny mites on leaf undersides.', 'تنقيط دقيق، تلون برونزي، خيوط عنكبوتية، تساقط أوراق، ووجود الحلم أسفل الورقة.', 'Spray water to reduce dust, conserve predatory mites, avoid excess broad-spectrum insecticides, and use miticides when needed.', 'رش الماء لتقليل الغبار، حماية الأكاروسات المفترسة، تجنب المبيدات الواسعة الزائدة، واستخدام مبيد أكاروسي عند الحاجة.'),
(42, 'Bacterial', 'مرض العدوى البكتيرية', 'A general bacterial plant disease causing spots, wilts, rots, or blights depending on the pathogen.', 'مرض بكتيري عام يسبب بقعاً أو ذبولاً أو تعفناً أو لفحات حسب نوع المسبب.', 'Water-soaked lesions, yellow halos, ooze, wilting, soft rot, and rapid spread in wet weather.', 'بقع مائية، هالات صفراء، إفرازات، ذبول، تعفن طري، وانتشار سريع مع الرطوبة.', 'Use clean planting material, sanitize tools, avoid wet handling, improve drainage, and apply copper or approved bactericides preventively.', 'استخدام مواد زراعة سليمة، تعقيم الأدوات، تجنب العمل عند البلل، تحسين الصرف، واستخدام النحاس أو مبيدات بكتيرية معتمدة وقائياً.'),
(43, 'Downy Mildew on Lettuce', 'مرض البياض الزغبي في الخس', 'An oomycete disease of lettuce caused mainly by Bremia lactucae.', 'مرض بياض زغبي في الخس تسببه غالباً Bremia lactucae.', 'Pale yellow angular spots on upper leaves, white downy growth underneath, leaf browning, and poor quality.', 'بقع صفراء باهتة زاوية أعلى الورقة، نمو زغبي أبيض أسفلها، اسمرار الورقة، وضعف الجودة.', 'Use resistant lettuce varieties, reduce humidity, space plants well, avoid overhead irrigation, and apply labeled fungicides.', 'زراعة أصناف خس مقاومة، تقليل الرطوبة، ترك مسافات مناسبة، تجنب الري بالرش، واستخدام مبيدات مسجلة.'),
(44, 'Powdery Mildew on Lettuce', 'مرض البياض الدقيقي في الخس', 'A fungal lettuce disease producing white powdery growth, especially in warm dry days with humid nights.', 'مرض فطري في الخس يظهر كنمو أبيض دقيقي خاصة مع النهار الدافئ والليل الرطب.', 'White powder on leaves, yellowing, leaf distortion, reduced head quality, and early senescence.', 'مسحوق أبيض على الأوراق، اصفرار، تشوه، انخفاض جودة الرأس، وشيخوخة مبكرة.', 'Improve ventilation, avoid dense planting, remove infected leaves, and apply sulfur or labeled fungicides suitable for lettuce.', 'تحسين التهوية، تجنب الزراعة الكثيفة، إزالة الأوراق المصابة، واستخدام الكبريت أو مبيدات مناسبة للخس.'),
(45, 'Septoria Blight on Lettuce', 'مرض لفحة السيبتوريا في الخس', 'A fungal lettuce disease caused by Septoria species that damages older leaves first.', 'مرض فطري في الخس تسببه أنواع Septoria ويبدأ غالباً بالأوراق القديمة.', 'Small water-soaked spots becoming brown with grey centers, many leaf lesions, blight, and leaf loss.', 'بقع مائية صغيرة تتحول لبنية بمراكز رمادية، كثرة البقع، لفحة، وفقدان أوراق.', 'Use clean seed, rotate crops, remove plant debris, water at soil level, and apply protective fungicides.', 'استخدام بذور سليمة، تدوير المحصول، إزالة المخلفات، الري عند التربة، ورش مبيد وقائي.'),
(46, 'Shepherd Purse Weeds', 'مرض عشبة كيس الراعي', 'A common weed that competes with crops and can host insects and diseases, especially in brassica systems.', 'عشب شائع ينافس المحاصيل وقد يكون عائلاً للحشرات والأمراض خاصة مع الصليبيات.', 'Rosette leaves, small white flowers, heart-shaped seed pods, crop competition, and pest sheltering.', 'أوراق وردية، أزهار بيضاء صغيرة، قرون بذور قلبية الشكل، منافسة للمحصول، وإيواء آفات.', 'Remove before flowering, cultivate shallowly, mulch, rotate crops, and use approved herbicides when necessary.', 'إزالته قبل الإزهار، العزيق السطحي، استخدام الملش، تدوير المحصول، واستخدام مبيدات أعشاب معتمدة عند الضرورة.'),
(47, 'Viral', 'مرض العدوى الفيروسية', 'A general viral plant disease category that alters growth and color and is often spread by insects or infected seed.', 'تصنيف عام للأمراض الفيروسية التي تغير النمو واللون وتنتقل غالباً بالحشرات أو البذور المصابة.', 'Mosaic, mottling, curling, stunting, ring spots, poor flowering, and reduced yield.', 'تبرقش، تلطخ لوني، التفاف، تقزم، بقع حلقية، ضعف إزهار، ونقص محصول.', 'Remove infected plants, control vectors, use resistant varieties, disinfect tools, and plant certified disease-free material.', 'إزالة النباتات المصابة، مكافحة النواقل، استخدام أصناف مقاومة، تعقيم الأدوات، وزراعة مواد معتمدة خالية من المرض.'),
(48, 'Cutting Weevil', 'مرض سوسة القطع', 'Damage caused by weevils cutting or feeding on young shoots, leaves, or stems.', 'ضرر تسببه سوسة تقطع أو تتغذى على البادرات أو الأوراق أو السيقان.', 'Cut seedlings, notched leaves, wilting shoots, feeding holes, and larvae near crowns or roots.', 'بادرات مقطوعة، حواف أوراق مقروضة، ذبول نموات، ثقوب تغذية، ويرقات قرب التاج أو الجذور.', 'Remove crop debris, cultivate soil, use traps, protect seedlings, and apply registered insecticides at early infestation.', 'إزالة بقايا المحصول، حراثة التربة، استخدام المصائد، حماية الشتلات، والرش بمبيد مسجل عند بداية الإصابة.'),
(49, 'Die Back', 'مرض موت الأفرع الخلفي', 'A condition where shoots or branches die from the tip backward due to pathogens, stress, or cankers.', 'حالة تموت فيها الأفرع من الأطراف إلى الخلف بسبب مسببات مرضية أو إجهاد أو تقرحات.', 'Dead shoot tips, leaf drying, bark discoloration, cankers, reduced vigor, and branch decline.', 'موت أطراف الأفرع، جفاف الأوراق، تغير لون القلف، تقرحات، ضعف نمو، وتدهور الأفرع.', 'Prune into healthy wood, disinfect tools, reduce stress, improve nutrition and irrigation, and treat confirmed pathogens.', 'التقليم حتى الخشب السليم، تعقيم الأدوات، تقليل الإجهاد، تحسين التغذية والري، ومعالجة المسبب المؤكد.'),
(50, 'Gall Midge', 'مرض ذبابة المرارة', 'A tiny fly whose larvae cause swellings, galls, or distorted plant tissues.', 'ذبابة صغيرة تسبب يرقاتها انتفاخات أو أوراماً أو تشوهات في أنسجة النبات.', 'Galls on leaves or shoots, curled tissues, stunted growing points, discoloration, and tiny larvae inside galls.', 'أورام على الأوراق أو النموات، التفاف الأنسجة، تقزم القمم، تغير لون، ويرقات صغيرة داخل الأورام.', 'Remove galled tissues, destroy infested debris, monitor adult flights, use resistant varieties, and apply insecticides at egg hatch if needed.', 'إزالة الأنسجة المتورمة، إتلاف المخلفات المصابة، مراقبة طيران الحشرات، استخدام أصناف مقاومة، والرش وقت فقس البيض عند الحاجة.'),
(51, 'Aculus olearius', 'مرض أكيولوس أولياريوس', 'An eriophyid mite pest of olive that feeds on leaves and young fruit.', 'حلم دودي من آفات الزيتون يتغذى على الأوراق والثمار الحديثة.', 'Leaf bronzing, curling, rough fruit skin, reduced fruit size, and tiny mites visible under magnification.', 'تلون برونزي للأوراق، التفاف، خشونة قشرة الثمار، صغر حجم الثمرة، وحلم صغير يرى بالتكبير.', 'Monitor new growth, avoid unnecessary insecticides, conserve predators, and apply suitable miticides or sulfur when populations are high.', 'مراقبة النموات الحديثة، تجنب المبيدات غير الضرورية، حماية المفترسات، واستخدام مبيد أكاروسي أو كبريت عند زيادة الإصابة.'),
(52, 'Peacock Spot', 'مرض تبقع عين الطاووس', 'An olive fungal leaf disease caused by Venturia oleaginea, favored by cool wet weather.', 'مرض فطري يصيب أوراق الزيتون تسببه Venturia oleaginea وينتشر في الجو البارد الرطب.', 'Circular dark spots with yellow halos resembling peacock eyes, leaf yellowing, and defoliation.', 'بقع دائرية داكنة بهالات صفراء تشبه عين الطاووس، اصفرار وتساقط الأوراق.', 'Prune for air circulation, avoid excessive nitrogen, remove infected leaves, and apply copper sprays before rainy seasons.', 'التقليم للتهوية، تجنب زيادة النيتروجين، إزالة الأوراق المصابة، ورش النحاس قبل مواسم المطر.'),
(53, 'Citrus Canker Diseases Leaf', 'مرض تقرح أوراق الحمضيات', 'Leaf infection phase of citrus canker caused by Xanthomonas citri.', 'الطور الورقي من مرض تقرح الحمضيات البكتيري الذي تسببه Xanthomonas citri.', 'Raised corky leaf lesions, oily margins, yellow halos, leaf distortion, and premature leaf fall.', 'تقرحات فلينية مرتفعة على الأوراق، حواف زيتية، هالات صفراء، تشوه، وتساقط مبكر.', 'Use clean nursery trees, prune infected flushes, disinfect tools, manage leafminer damage, and apply copper protectants.', 'استخدام شتلات سليمة، تقليم النموات المصابة، تعقيم الأدوات، مكافحة حفار أوراق الحمضيات، ورش النحاس الوقائي.'),
(54, 'Citrus Nutrient Deficiency Yellow', 'مرض اصفرار نقص عناصر الحمضيات', 'A citrus nutritional disorder causing yellow leaves due to deficiencies such as nitrogen, iron, zinc, or magnesium.', 'اضطراب غذائي في الحمضيات يسبب اصفرار الأوراق بسبب نقص مثل النيتروجين أو الحديد أو الزنك أو المغنيسيوم.', 'General yellowing, interveinal chlorosis, small leaves, twig dieback, and poor fruit size depending on nutrient.', 'اصفرار عام أو بين العروق، صغر الأوراق، موت أطراف، وضعف حجم الثمار حسب العنصر الناقص.', 'Run soil and leaf tests, correct pH, apply balanced citrus fertilizer and specific micronutrients, and improve irrigation.', 'إجراء تحليل تربة وأوراق، تعديل pH، إضافة تسميد متوازن للحمضيات وعناصر صغرى محددة، وتحسين الري.'),
(55, 'Multiple Diseases Leaf', 'مرض الإصابات المتعددة في الأوراق', 'A mixed leaf condition where more than one pathogen or stress affects the same plant.', 'حالة ورقية مختلطة عندما يصيب النبات أكثر من مسبب مرضي أو عامل إجهاد.', 'Mixed spots, blight, yellowing, necrosis, distortion, and symptoms that vary across leaves.', 'بقع مختلفة، لفحة، اصفرار، موت أنسجة، تشوه، وأعراض متباينة بين الأوراق.', 'Diagnose the main cause, remove heavily infected leaves, improve cultural conditions, and combine targeted fungicide, bactericide, or pest control as needed.', 'تشخيص السبب الأساسي، إزالة الأوراق شديدة الإصابة، تحسين ظروف الزراعة، والجمع بين مبيد فطري أو بكتيري أو مكافحة آفات حسب الحاجة.'),
(56, 'Leafminer Leaf', 'مرض حفّار أنفاق الأوراق', 'Damage caused by leafminer larvae tunneling between leaf surfaces.', 'ضرر تسببه يرقات حفار الأوراق التي تحفر أنفاقاً بين سطحي الورقة.', 'Winding white or brown tunnels, distorted young leaves, reduced photosynthesis, and secondary infection entry points.', 'أنفاق متعرجة بيضاء أو بنية، تشوه الأوراق الحديثة، انخفاض البناء الضوئي، ومداخل لعدوى ثانوية.', 'Remove mined leaves, use yellow sticky traps, protect natural parasitoids, and apply selective insecticides on young larvae.', 'إزالة الأوراق المحفورة، استخدام المصائد الصفراء، حماية الطفيليات النافعة، والرش بمبيد انتقائي على اليرقات الصغيرة.'),
(57, 'Bacterial Spot', 'مرض التبقع البكتيري', 'A bacterial disease producing spots on leaves, stems, and fruit in crops such as tomato and pepper.', 'مرض بكتيري يسبب بقعاً على الأوراق والسيقان والثمار مثل الطماطم والفلفل.', 'Small water-soaked spots, yellow halos, dark scabby fruit lesions, leaf drop, and blight.', 'بقع صغيرة مائية، هالات صفراء، بقع جرباء داكنة على الثمار، تساقط أوراق، ولفحة.', 'Use pathogen-free seed, rotate crops, avoid overhead irrigation, remove debris, and use copper plus labeled protectants preventively.', 'استخدام بذور خالية من المرض، تدوير المحاصيل، تجنب الري بالرش، إزالة المخلفات، واستخدام النحاس مع مواد وقائية مسجلة.'),
(58, 'Alternaria', 'مرض الألترناريا', 'A fungal disease group caused by Alternaria species affecting leaves, stems, and fruit.', 'مجموعة أمراض فطرية تسببها أنواع Alternaria وتصيب الأوراق والسيقان والثمار.', 'Dark spots with concentric rings, yellowing, blight, stem cankers, and fruit rot.', 'بقع داكنة بحلقات متداخلة، اصفرار، لفحة، تقرحات ساق، وتعفن ثمار.', 'Rotate crops, reduce leaf wetness, remove infected residue, use resistant varieties, and apply fungicides when needed.', 'تدوير المحاصيل، تقليل بلل الأوراق، إزالة البقايا المصابة، استخدام أصناف مقاومة، والرش عند الحاجة.'),
(59, 'Cercospora', 'مرض السيركوسبورا', 'A fungal disease group causing leaf spots in many vegetables, fruits, and field crops.', 'مجموعة أمراض فطرية تسبب بقعاً ورقية في خضار وفاكهة ومحاصيل حقلية كثيرة.', 'Numerous small grey or tan spots with dark borders, yellowing, leaf thinning, and defoliation.', 'بقع صغيرة كثيرة رمادية أو بنية فاتحة بحواف داكنة، اصفرار، ضعف الورقة، وتساقطها.', 'Practice rotation, destroy infected debris, avoid overhead watering, use resistant cultivars, and apply fungicides early.', 'اتباع دورة زراعية، التخلص من المخلفات المصابة، تجنب الري بالرش، استخدام أصناف مقاومة، والرش المبكر.'),
(60, 'Early Blight', 'مرض اللفحة المبكرة', 'A common Alternaria disease of tomato and potato that starts on older foliage.', 'مرض Alternaria شائع في الطماطم والبطاطس يبدأ غالباً على الأوراق السفلية القديمة.', 'Target-like brown leaf spots, yellowing, lower leaf drop, collar rot on seedlings, and fruit lesions.', 'بقع بنية تشبه الهدف، اصفرار، تساقط الأوراق السفلية، تعفن طوق الشتلات، وبقع على الثمار.', 'Remove lower infected leaves, mulch, stake plants, rotate away from solanaceous crops, and use fungicide programs.', 'إزالة الأوراق السفلية المصابة، استخدام الملش، تدعيم النباتات، تدوير بعيداً عن العائلة الباذنجانية، واتباع برنامج رش فطري.'),
(61, 'Late Blight', 'مرض اللفحة المتأخرة', 'A destructive oomycete disease caused by Phytophthora infestans in potato and tomato.', 'مرض مدمر شبيه بالفطريات تسببه Phytophthora infestans في البطاطس والطماطم.', 'Water-soaked leaf lesions, white mold at lesion edges, brown stem lesions, rapid collapse, and fruit rot.', 'بقع مائية على الأوراق، نمو أبيض عند حواف البقع، بقع بنية على الساق، انهيار سريع، وتعفن ثمار.', 'Plant certified seed, destroy volunteers, improve air flow, avoid wet foliage, and apply late-blight fungicides preventively.', 'زراعة تقاوي معتمدة، إزالة النباتات المتطوعة، تحسين التهوية، تجنب بلل الأوراق، واستخدام مبيدات اللفحة المتأخرة وقائياً.'),
(62, 'Bacterial Leaf Spot', 'مرض التبقع البكتيري للأوراق', 'A bacterial leaf disease causing angular or irregular spots that expand under wet conditions.', 'مرض بقع بكتيري يسبب بقعاً زاوية أو غير منتظمة تتوسع في الجو الرطب.', 'Water-soaked angular spots, yellow halos, necrotic patches, leaf tearing, and defoliation.', 'بقع زاوية مائية، هالات صفراء، مناطق ميتة، تمزق الورقة، وتساقطها.', 'Use clean seed and transplants, avoid overhead irrigation, sanitize tools, rotate crops, and apply copper products preventively.', 'استخدام بذور وشتلات سليمة، تجنب الري بالرش، تعقيم الأدوات، تدوير المحصول، ورش النحاس وقائياً.'),
(63, 'Mosaic Disease', 'مرض الموزاييك', 'A viral disease causing patchy leaf discoloration and distorted plant growth.', 'مرض فيروسي يسبب تبرقشاً لونياً وتشوه نمو النبات.', 'Mosaic mottling, curled or distorted leaves, stunting, poor fruit quality, and reduced yield.', 'تبرقش موزايكي، أوراق ملتفة أو مشوهة، تقزم، ضعف جودة الثمار، ونقص المحصول.', 'Remove infected plants, control insect vectors, disinfect tools, avoid tobacco contamination in solanaceous crops, and use resistant varieties.', 'إزالة النباتات المصابة، مكافحة النواقل، تعقيم الأدوات، تجنب تلوث التبغ في الباذنجانيات، واستخدام أصناف مقاومة.'),
(64, 'Black Leaf Spot', 'مرض التبقع الأسود للأوراق', 'A leaf spot disease causing dark necrotic spots from fungi or bacteria.', 'مرض بقع ورقية يسبب بقعاً سوداء ميتة بسبب فطريات أو بكتيريا.', 'Black circular or irregular spots, yellowing around lesions, leaf blight, and premature leaf fall.', 'بقع سوداء دائرية أو غير منتظمة، اصفرار حولها، لفحة، وتساقط مبكر.', 'Remove infected leaves, avoid splashing water, improve spacing, and use fungicide or bactericide after diagnosis.', 'إزالة الأوراق المصابة، تجنب رذاذ الماء، تحسين المسافات، واستخدام مبيد فطري أو بكتيري بعد التشخيص.'),
(65, 'Flea Beetle', 'مرض خنفساء البرغوث', 'Small jumping beetles that chew many tiny holes in leaves, especially seedlings.', 'خنافس صغيرة قافزة تقرض ثقوباً كثيرة صغيرة في الأوراق خاصة البادرات.', 'Shot-hole leaf feeding, small pits, weakened seedlings, stunting, and beetles jumping when disturbed.', 'ثقوب صغيرة كالرصاص، حفر سطحية، ضعف البادرات، تقزم، وقفز الخنافس عند الإزعاج.', 'Use row covers, remove weeds, rotate crops, trap crops where useful, and apply insecticides when seedlings are at risk.', 'استخدام أغطية الصفوف، إزالة الأعشاب، تدوير المحصول، استخدام محاصيل جاذبة عند الفائدة، والرش عند تهديد البادرات.'),
(66, 'Southern Blight', 'مرض اللفحة الجنوبية', 'A soilborne fungal disease caused by Sclerotium rolfsii that attacks stems near soil level.', 'مرض فطري ينتقل بالتربة تسببه Sclerotium rolfsii ويصيب الساق قرب سطح التربة.', 'Wilting, stem rot at soil line, white fan-like mycelium, and small tan sclerotia.', 'ذبول، تعفن الساق عند سطح التربة، نمو فطري أبيض مروحي، وأجسام حجرية بنية صغيرة.', 'Remove infected plants with surrounding soil, rotate crops, improve drainage, avoid deep planting, and use soil treatments where approved.', 'إزالة النباتات المصابة مع التربة حولها، تدوير المحاصيل، تحسين الصرف، تجنب الزراعة العميقة، واستخدام معاملات تربة معتمدة.'),
(67, 'Sudden Death Syndrome', 'مرض متلازمة الموت المفاجئ', 'A soybean disease complex associated with Fusarium root infection and toxin movement to leaves.', 'مرض معقد في فول الصويا يرتبط بإصابة الجذور بفطر Fusarium وانتقال السموم للأوراق.', 'Interveinal chlorosis and necrosis, green veins, root rot, leaf drop, and sudden plant decline.', 'اصفرار وموت بين العروق مع بقاء العروق خضراء، تعفن جذور، تساقط أوراق، وتدهور مفاجئ.', 'Plant resistant varieties, improve drainage, reduce soil compaction, use seed treatments, and rotate with non-host crops.', 'زراعة أصناف مقاومة، تحسين الصرف، تقليل انضغاط التربة، استخدام معاملات البذور، والتدوير بمحاصيل غير عائلة.'),
(68, 'Yellow Mosaic', 'مرض الموزاييك الأصفر', 'A viral disease producing bright yellow mosaic patterns, often spread by whiteflies or aphids.', 'مرض فيروسي يسبب تبرقشاً أصفر واضحاً وينتقل غالباً بالذبابة البيضاء أو المن.', 'Yellow mosaic patches, leaf curling, stunting, fewer pods or fruit, and reduced yield.', 'بقع موزاييك صفراء، التفاف أوراق، تقزم، قلة القرون أو الثمار، ونقص المحصول.', 'Remove infected plants early, control vectors, use resistant varieties, remove weed hosts, and plant healthy seed.', 'إزالة النباتات المصابة مبكراً، مكافحة النواقل، استخدام أصناف مقاومة، إزالة الأعشاب العائلة، وزراعة بذور سليمة.'),
(69, 'Brown Spot', 'مرض التبقع البني', 'A fungal disease causing brown lesions on leaves and sometimes stems or pods.', 'مرض فطري يسبب بقعاً بنية على الأوراق وأحياناً السيقان أو القرون.', 'Small to large brown spots, yellowing, lower leaf defoliation, and reduced vigor.', 'بقع بنية صغيرة إلى كبيرة، اصفرار، تساقط الأوراق السفلية، وضعف النمو.', 'Rotate crops, bury residue, avoid overhead irrigation, plant resistant varieties, and apply fungicides if disease develops early.', 'تدوير المحاصيل، دفن المخلفات، تجنب الري بالرش، زراعة أصناف مقاومة، والرش إذا ظهر المرض مبكراً.'),
(70, 'Crestamento', 'مرض كريستامنتو', 'A blight or scorch-like disease name used for leaf burning symptoms in some crops.', 'اسم يستخدم لأعراض لفحة أو احتراق أوراق في بعض المحاصيل.', 'Leaf edge burn, brown blighted areas, yellowing, drying leaves, and reduced photosynthetic area.', 'احتراق حواف الأوراق، مناطق بنية ملفوحة، اصفرار، جفاف الأوراق، ونقص مساحة البناء الضوئي.', 'Identify whether the cause is fungal, bacterial, or stress; improve irrigation, remove infected leaves, and apply targeted treatments.', 'تحديد هل السبب فطري أو بكتيري أو إجهاد؛ تحسين الري، إزالة الأوراق المصابة، واستخدام علاج موجه.'),
(71, 'Ferrugen', 'مرض فيروجين', 'A rust-like disease condition producing reddish-brown spots or pustules on foliage.', 'حالة مرضية تشبه الصدأ وتسبب بقعاً أو بثرات بنية محمرة على الأوراق.', 'Reddish-brown lesions, rusty powder, yellow halos, leaf drying, and premature defoliation.', 'بقع بنية محمرة، مسحوق صدئي، هالات صفراء، جفاف، وتساقط مبكر.', 'Remove infected leaves, reduce humidity, use resistant varieties when available, and apply rust-control fungicides early.', 'إزالة الأوراق المصابة، تقليل الرطوبة، استخدام أصناف مقاومة عند توفرها، والرش المبكر بمبيدات الصدأ.'),
(72, 'Septoria', 'مرض السيبتوريا', 'A fungal disease group causing small spots with pale centers and dark fruiting bodies.', 'مجموعة أمراض فطرية تسبب بقعاً صغيرة بمراكز فاتحة وأجسام ثمرية داكنة.', 'Small circular spots, grey centers, dark specks, yellowing leaves, and defoliation.', 'بقع دائرية صغيرة، مراكز رمادية، نقاط داكنة، اصفرار، وتساقط الأوراق.', 'Rotate crops, remove infected debris, stake plants, avoid wet foliage, and apply protective fungicides.', 'تدوير المحاصيل، إزالة المخلفات المصابة، تدعيم النباتات، تجنب بلل الأوراق، ورش مبيدات وقائية.'),
(73, 'Leaf Scorch', 'مرض احتراق الأوراق', 'A symptom or disease where leaf margins or areas dry and look burned due to stress or pathogens.', 'عرض أو مرض تظهر فيه حواف الورقة أو أجزاء منها كأنها محترقة بسبب الإجهاد أو الممرضات.', 'Brown leaf margins, tip burn, interveinal browning, wilting, and dry brittle leaves.', 'اسمرار حواف الورقة، احتراق الأطراف، اسمرار بين العروق، ذبول، وأوراق جافة هشة.', 'Improve watering, reduce salt and heat stress, mulch, test roots and nutrients, and manage confirmed bacterial or fungal causes.', 'تحسين الري، تقليل الملوحة والحرارة، استخدام الملش، فحص الجذور والعناصر، ومعالجة السبب البكتيري أو الفطري المؤكد.'),
(74, 'Leaf Mold', 'مرض عفن الأوراق', 'A fungal tomato disease caused by Passalora fulva, common in humid greenhouses.', 'مرض فطري في الطماطم تسببه Passalora fulva ويكثر في البيوت المحمية الرطبة.', 'Yellow spots on upper leaves, olive-brown mold underneath, leaf curling, drying, and defoliation.', 'بقع صفراء أعلى الأوراق، عفن زيتوني بني أسفلها، التفاف، جفاف، وتساقط الأوراق.', 'Ventilate greenhouses, reduce humidity, avoid leaf wetness, remove infected leaves, and use resistant varieties or fungicides.', 'تهوية البيوت المحمية، تقليل الرطوبة، تجنب بلل الأوراق، إزالة المصاب، واستخدام أصناف مقاومة أو مبيدات.'),
(75, 'Septoria Leaf Spot', 'مرض تبقع أوراق السيبتوريا', 'A tomato leaf disease caused by Septoria lycopersici, usually starting on lower leaves.', 'مرض بقع أوراق الطماطم تسببه Septoria lycopersici ويبدأ غالباً بالأوراق السفلية.', 'Many small spots with grey centers and dark borders, black pycnidia, yellowing, and defoliation.', 'بقع صغيرة كثيرة بمراكز رمادية وحواف داكنة، نقاط سوداء، اصفرار، وتساقط الأوراق.', 'Remove lower infected leaves, mulch, avoid overhead irrigation, rotate crops, and apply fungicides preventively.', 'إزالة الأوراق السفلية المصابة، استخدام الملش، تجنب الري بالرش، تدوير المحصول، والرش الوقائي.'),
(76, 'Spider Mites', 'مرض العنكبوت الأحمر ثنائي البقعة', 'A serious mite pest, Tetranychus urticae, that feeds on many crops under hot dry conditions.', 'آفة حلمية خطيرة هي Tetranychus urticae تتغذى على محاصيل كثيرة في الجو الحار الجاف.', 'Yellow stippling, webbing, bronzed leaves, leaf drop, and two-spotted mites on undersides.', 'تنقيط أصفر، خيوط عنكبوتية، تلون برونزي، تساقط أوراق، وحلم ذو بقعتين أسفل الورقة.', 'Increase humidity where practical, wash leaves, conserve predatory mites, rotate miticide modes of action, and avoid pesticide flare-ups.', 'زيادة الرطوبة عند الإمكان، غسل الأوراق، حماية الأعداء الحيوية، تدوير مجموعات مبيدات الأكاروس، وتجنب المبيدات التي تزيد الإصابة.'),
(77, 'Target Spot', 'مرض التبقع الهدف', 'A fungal disease causing target-like spots, common on tomato leaves and fruit in humid areas.', 'مرض فطري يسبب بقعاً تشبه الهدف ويصيب غالباً أوراق وثمار الطماطم في الرطوبة.', 'Brown circular lesions with concentric rings, yellowing, defoliation, and sunken fruit spots.', 'بقع بنية دائرية بحلقات متداخلة، اصفرار، تساقط أوراق، وبقع غائرة على الثمار.', 'Improve air flow, remove infected leaves, avoid overhead watering, rotate crops, and apply labeled fungicides.', 'تحسين التهوية، إزالة الأوراق المصابة، تجنب الري بالرش، تدوير المحصول، ورش مبيدات فطرية مسجلة.'),
(78, 'Tomato Yellow Leaf Curl Virus', 'مرض فيروس تجعد أوراق الطماطم الأصفر', 'A major tomato viral disease transmitted mainly by whiteflies.', 'مرض فيروسي مهم في الطماطم ينتقل أساساً بالذبابة البيضاء.', 'Upward leaf curling, yellow leaf margins, severe stunting, flower drop, and very low fruit set.', 'التفاف الأوراق للأعلى، اصفرار الحواف، تقزم شديد، تساقط الأزهار، وضعف شديد في العقد.', 'Use resistant hybrids, control whiteflies, use insect-proof nets, remove infected plants, and eliminate weed hosts.', 'استخدام هجن مقاومة، مكافحة الذبابة البيضاء، استخدام الشباك الحشرية، إزالة النباتات المصابة، وإزالة الأعشاب العائلة.'),
(79, 'Tomato Mosaic Virus', 'مرض فيروس موزاييك الطماطم', 'A stable virus affecting tomato and related crops, spread by contact, tools, seed, and plant debris.', 'فيروس ثابت يصيب الطماطم ومحاصيل قريبة وينتقل بالملامسة والأدوات والبذور والمخلفات.', 'Mottled mosaic leaves, fern-like leaf narrowing, stunting, uneven fruit ripening, and internal browning.', 'تبرقش الأوراق، تضيق ورقي يشبه السرخس، تقزم، نضج غير منتظم للثمار، واسمرار داخلي.', 'Use resistant varieties, plant certified seed, disinfect tools and hands, remove infected plants, and avoid tobacco handling near plants.', 'استخدام أصناف مقاومة، زراعة بذور معتمدة، تعقيم الأدوات والأيدي، إزالة النباتات المصابة، وتجنب التعامل مع التبغ قرب النباتات.');
INSERT INTO `diseases` (`DiseaseId`, `Name`, `NameAr`, `Description`, `DescriptionAr`, `Symptoms`, `SymptomsAr`, `Treatment`, `TreatmentAr`) VALUES
(80, 'Mosaic Virus', 'مرض فيروس الموزاييك', 'A general viral infection causing mosaic patterns and growth reduction in many crops.', 'عدوى فيروسية عامة تسبب نمط موزاييك وضعف نمو في محاصيل كثيرة.', 'Light and dark green mottling, leaf deformation, stunting, poor fruit quality, and reduced yield.', 'تداخل أخضر فاتح وداكن، تشوه أوراق، تقزم، ضعف جودة الثمار، ونقص الإنتاج.', 'Remove infected plants, manage insect vectors, use resistant cultivars, control weeds, and plant virus-free material.', 'إزالة النباتات المصابة، مكافحة النواقل، استخدام أصناف مقاومة، مكافحة الأعشاب، وزراعة مواد خالية من الفيروس.'),
(81, 'Bacterial Canker', 'مرض التقرح البكتيري', 'A bacterial disease causing cankers, wilting, and fruit spotting, especially in tomato and woody plants.', 'مرض بكتيري يسبب تقرحات وذبولاً وبقع ثمار خاصة في الطماطم والنباتات الخشبية.', 'Leaf edge burn, wilting, stem cankers, vascular discoloration, bird-eye fruit spots, and plant decline.', 'احتراق حواف الأوراق، ذبول، تقرحات ساق، تلون الأوعية، بقع عين الطائر على الثمار، وتدهور النبات.', 'Use certified seed, hot-water treat seed where recommended, sanitize tools, remove infected plants, rotate crops, and avoid overhead irrigation.', 'استخدام بذور معتمدة، معاملة البذور بالماء الساخن عند التوصية، تعقيم الأدوات، إزالة المصاب، تدوير المحصول، وتجنب الري بالرش.'),
(82, 'Healthy', 'سليم', 'The plant appears healthy with no visible signs of disease or damage, and no treatment is needed at this time.', 'النبتة تبدو سليمة ولا تظهر عليها أي علامات مرض أو ضرر، ولا تحتاج إلى علاج حاليًا.', 'Leaves appear normal and healthy.', 'الأوراق تبدو طبيعية وسليمة.', 'No treatment needed.', 'لا حاجة للعلاج.'),
(83, 'Not Recognize', 'غير معروف', 'The uploaded image is not recognized as a supported plant image or the image is unclear.', 'الصورة المرفوعة غير معروفة أو لا تحتوي على نبات مدعوم أو أن الصورة غير واضحة بما يكفي للتحليل.', 'No plant disease symptoms were detected because the image could not be recognized correctly.', 'لم يتم اكتشاف أعراض مرضية لأن الصورة لم يتم التعرف عليها بشكل صحيح.', 'Please upload a clear image of a supported plant leaf or fruit with good lighting and focus.', 'يرجى رفع صورة واضحة لورقة أو ثمرة نبات مدعوم مع إضاءة جيدة وتركيز واضح.');

-- --------------------------------------------------------

--
-- Table structure for table `imagediagnoses`
--

CREATE TABLE `imagediagnoses` (
  `DiagnosisId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `DiseaseId` int(11) DEFAULT NULL,
  `ImageUrl` varchar(500) DEFAULT NULL,
  `ConfidencePercent` decimal(5,2) DEFAULT NULL,
  `Status` varchar(30) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `imagediagnoses`
--

INSERT INTO `imagediagnoses` (`DiagnosisId`, `UserId`, `DiseaseId`, `ImageUrl`, `ConfidencePercent`, `Status`, `CreatedAt`) VALUES
(4, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777041316/diagnoses/zr3mov1fggyzmr0x5qrf.jpg', 14.08, 'Completed', '2026-04-24 14:35:19'),
(5, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777041384/diagnoses/lipp55t6majknoujhqrd.jpg', 92.08, 'Completed', '2026-04-24 14:36:23'),
(6, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777042533/diagnoses/sqeqlbz7xa3ealccje0j.jpg', 18.56, 'Completed', '2026-04-24 14:55:32'),
(7, 0, 68, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777046444/diagnoses/bvgy2j8abr0csp9bxobw.jpg', 25.51, 'Completed', '2026-04-24 16:00:42'),
(8, 0, 7, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777049470/diagnoses/wpqoh4jbd7h87v3apjmw.jpg', 42.31, 'Completed', '2026-04-24 16:51:09'),
(9, 0, 43, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777049775/diagnoses/moiif9qkyxxrclgjf3fu.jpg', 68.49, 'Completed', '2026-04-24 16:56:13'),
(10, 0, 17, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777049786/diagnoses/qg6c4peuvcyirwibuabr.jpg', 88.37, 'Completed', '2026-04-24 16:56:24'),
(11, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777050796/diagnoses/u50tkka3vjhscdjbmmxk.jpg', 98.94, 'Completed', '2026-04-24 17:13:17'),
(12, 0, 3, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051241/diagnoses/jj3593k0mydxhnmuwshg.jpg', 92.09, 'Completed', '2026-04-24 17:20:42'),
(13, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051258/diagnoses/hq9ylodcmkubg8uq2y8j.jpg', 72.91, 'Completed', '2026-04-24 17:20:58'),
(14, 0, 3, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051312/diagnoses/hf1zdbut2gjxoedzr1ta.jpg', 99.93, 'Completed', '2026-04-24 17:21:53'),
(15, 0, 18, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051346/diagnoses/qkcujfq8tzenk7ewavns.jpg', 54.28, 'Completed', '2026-04-24 17:22:26'),
(16, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051442/diagnoses/omfxveufkxrxftnlryvz.jpg', 99.99, 'Completed', '2026-04-24 17:24:03'),
(17, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777051483/diagnoses/ybhaxjbm8uvlkpglknhd.jpg', 95.30, 'Completed', '2026-04-24 17:24:44'),
(18, 0, 28, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777066221/diagnoses/ni3o6njlczhxqeoq9mwo.jpg', 45.44, 'Completed', '2026-04-24 21:30:24'),
(19, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777066223/diagnoses/a0fonkpspolpzxzet0jq.jpg', 99.91, 'Completed', '2026-04-24 21:30:24'),
(20, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777066252/diagnoses/yxswbrzxyy5pkjojp02k.jpg', 99.93, 'Completed', '2026-04-24 21:30:51'),
(21, 0, 15, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777066296/diagnoses/raznmzps9fvaymsqf4e1.jpg', 92.25, 'Completed', '2026-04-24 21:31:36'),
(22, 0, 71, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777077621/diagnoses/xybf71j35suzgrze5znr.png', 78.80, 'Completed', '2026-04-25 00:40:20'),
(23, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777137167/diagnoses/qi6lixl4wlrb1hthfbip.jpg', 99.28, 'Completed', '2026-04-25 17:12:53'),
(24, 0, 34, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777137256/diagnoses/lpci3qhwg3rnz0ql864t.jpg', 95.80, 'Completed', '2026-04-25 17:14:15'),
(25, 0, 23, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777143093/diagnoses/may4ttgu9apqbopc2xd1.jpg', 50.15, 'Completed', '2026-04-25 18:51:32'),
(26, 0, 4, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777143217/diagnoses/uuvvibw56ratdto0r2yw.jpg', 16.67, 'Completed', '2026-04-25 18:53:36'),
(27, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777224809/diagnoses/ncgekvfcwlkvqw56hge6.jpg', 72.91, 'Completed', '2026-04-26 17:33:34'),
(28, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777296849/diagnoses/fmvp7qmimn81bj6cfkij.jpg', 99.94, 'Completed', '2026-04-27 13:34:09'),
(29, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777296884/diagnoses/rn48zztlvvzuyb0olpqn.jpg', 99.65, 'Completed', '2026-04-27 13:34:44'),
(30, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777296891/diagnoses/wrjts4c9zy1z1mfdhzwa.jpg', 98.70, 'Completed', '2026-04-27 13:34:51'),
(31, 0, 3, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777297949/diagnoses/jttjgsqrkze8hyzbv43y.jpg', 100.00, 'Completed', '2026-04-27 13:52:29'),
(32, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777297958/diagnoses/kqv19umgcv5lll13tyw7.jpg', 99.95, 'Completed', '2026-04-27 13:52:38'),
(33, 0, 4, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777297967/diagnoses/py1n9qv7kavrzqirvq02.jpg', 99.99, 'Completed', '2026-04-27 13:52:47'),
(34, 0, 19, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777300098/diagnoses/rsgrv7cboyp2d3iri7y6.jpg', 98.79, 'Completed', '2026-04-27 14:28:18'),
(35, 0, 21, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777300113/diagnoses/axpwkuukevqiaizn30ap.jpg', 100.00, 'Completed', '2026-04-27 14:28:32'),
(36, 0, 30, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777300122/diagnoses/dyomrsndlyroh5w8up3s.jpg', 100.00, 'Completed', '2026-04-27 14:28:41'),
(37, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777301810/diagnoses/vq4y3n4bbdwpq1aqcgf8.jpg', 100.00, 'Completed', '2026-04-27 14:56:50'),
(38, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777301828/diagnoses/tv363dhrfhjphmq8cfja.jpg', 99.48, 'Completed', '2026-04-27 14:57:08'),
(39, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777301881/diagnoses/qjfsi3uhxbti2q6ddwyh.jpg', 98.58, 'Completed', '2026-04-27 14:58:01'),
(40, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777301920/diagnoses/dadyxhfjox6ofjizm2kj.jpg', 99.97, 'Completed', '2026-04-27 14:58:39'),
(41, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302100/diagnoses/sbluknrbi8iuowpmzs8d.jpg', 99.58, 'Completed', '2026-04-27 15:01:39'),
(42, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302119/diagnoses/eypebfg2gdk3xribfv7y.jpg', 99.65, 'Completed', '2026-04-27 15:01:58'),
(43, 0, 10, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302143/diagnoses/udvrihxjjzuqqvqprg02.jpg', 100.00, 'Completed', '2026-04-27 15:02:22'),
(44, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302158/diagnoses/ctviswymef2dvhvlun3z.jpg', 98.58, 'Completed', '2026-04-27 15:02:37'),
(45, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302250/diagnoses/zzhafuw7cjuvlrumnvoj.png', 99.73, 'Completed', '2026-04-27 15:04:10'),
(46, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302262/diagnoses/g1hpb5qinulxlqpzhg2a.jpg', 99.65, 'Completed', '2026-04-27 15:04:21'),
(47, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302298/diagnoses/c5c1wyrkvzrbw4pcc12m.jpg', 100.00, 'Completed', '2026-04-27 15:04:57'),
(48, 0, 15, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302320/diagnoses/fxkiobzltnaxycr0qlob.jpg', 99.99, 'Completed', '2026-04-27 15:05:19'),
(49, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302342/diagnoses/vbvlam2imcqhaiv0ff3k.png', 100.00, 'Completed', '2026-04-27 15:05:41'),
(50, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302393/diagnoses/sytoe1lfqpj6zroxokfn.jpg', 99.99, 'Completed', '2026-04-27 15:06:32'),
(51, 0, 73, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302413/diagnoses/pzmgid4yheh3ouguytuz.jpg', 96.81, 'Completed', '2026-04-27 15:06:52'),
(52, 0, 42, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302435/diagnoses/andb0wqmqjs5kibudtci.jpg', 40.82, 'Completed', '2026-04-27 15:07:15'),
(53, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302442/diagnoses/ltnsdnldkq28c9znwsrz.jpg', 95.91, 'Completed', '2026-04-27 15:07:21'),
(54, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302447/diagnoses/jroqo8soox9ga7tcmyvy.jpg', 99.32, 'Completed', '2026-04-27 15:07:26'),
(55, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302452/diagnoses/gz942fahngnah2v1xkk8.jpg', 95.91, 'Completed', '2026-04-27 15:07:31'),
(56, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302459/diagnoses/phlqohd9e8u6l1gon7uo.jpg', 90.77, 'Completed', '2026-04-27 15:07:39'),
(57, 0, 50, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302499/diagnoses/c9vjws22mxzqu8yqsazw.jpg', 100.00, 'Completed', '2026-04-27 15:08:18'),
(58, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302505/diagnoses/aufn3txtkmbtnbtqdcjm.jpg', 98.82, 'Completed', '2026-04-27 15:08:25'),
(59, 0, 50, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302511/diagnoses/gbphkxuxi2rbhnutwmia.jpg', 100.00, 'Completed', '2026-04-27 15:08:31'),
(60, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302524/diagnoses/ur4fzasqb97bft39illa.jpg', 99.96, 'Completed', '2026-04-27 15:08:43'),
(61, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302540/diagnoses/hennwddkjmkgbfugoqhi.jpg', 98.39, 'Completed', '2026-04-27 15:08:59'),
(62, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302559/diagnoses/rgifa81ymxtoebyfc8ea.jpg', 98.39, 'Completed', '2026-04-27 15:09:18'),
(63, 0, 66, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302660/diagnoses/hgej9xxd8xacuvcne5on.jpg', 92.39, 'Completed', '2026-04-27 15:11:00'),
(64, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302695/diagnoses/go8dpliv3ykt5llmb5r3.jpg', 81.38, 'Completed', '2026-04-27 15:11:34'),
(65, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302703/diagnoses/oapkesrrxc3zkwvlvj1g.jpg', 96.04, 'Completed', '2026-04-27 15:11:42'),
(66, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302710/diagnoses/yblafnk29anvqkjjzawc.jpg', 97.30, 'Completed', '2026-04-27 15:11:50'),
(67, 0, 42, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302719/diagnoses/om8vy62vhwjysrr1dfsf.jpg', 48.17, 'Completed', '2026-04-27 15:11:58'),
(68, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302727/diagnoses/b6cpciflajhhwsced6h2.jpg', 81.63, 'Completed', '2026-04-27 15:12:06'),
(69, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302761/diagnoses/jmrlbgcaqzkk3pfx9djx.jpg', 99.98, 'Completed', '2026-04-27 15:12:41'),
(70, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302769/diagnoses/c0c4nmatljp9qzxorwfi.jpg', 93.62, 'Completed', '2026-04-27 15:12:48'),
(71, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302778/diagnoses/semigkgh2le36wjszift.jpg', 99.96, 'Completed', '2026-04-27 15:12:57'),
(72, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302786/diagnoses/g46yey60b8gyt4nzmoop.jpg', 100.00, 'Completed', '2026-04-27 15:13:05'),
(73, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302793/diagnoses/bafg5wliz3ahcra94muo.jpg', 100.00, 'Completed', '2026-04-27 15:13:12'),
(74, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302801/diagnoses/hplnpzjhxgctk8stzkdp.jpg', 100.00, 'Completed', '2026-04-27 15:13:20'),
(75, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302806/diagnoses/fsdj7tdcwz7nnss04qyr.jpg', 100.00, 'Completed', '2026-04-27 15:13:25'),
(76, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302815/diagnoses/catkubbzt4fkxwtnbjwa.jpg', 96.75, 'Completed', '2026-04-27 15:13:34'),
(77, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302821/diagnoses/o7sggm2gfrsmhaywl7wq.jpg', 96.75, 'Completed', '2026-04-27 15:13:40'),
(78, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302829/diagnoses/s13fous2fl2nxaciitcb.jpg', 99.37, 'Completed', '2026-04-27 15:13:48'),
(79, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302836/diagnoses/ycuhnfz2ng9bgtrnjotl.jpg', 99.96, 'Completed', '2026-04-27 15:13:55'),
(80, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302844/diagnoses/du7dhu4ilidmk9vlcasx.jpg', 99.88, 'Completed', '2026-04-27 15:14:03'),
(81, 0, 74, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302851/diagnoses/jusykrjoeireyui8emxx.jpg', 83.28, 'Completed', '2026-04-27 15:14:10'),
(82, 0, 74, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302858/diagnoses/njtqsmxsxsi7w6hp9hwz.jpg', 96.08, 'Completed', '2026-04-27 15:14:17'),
(83, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302867/diagnoses/q7u35f2ty2p66wtqho5r.jpg', 82.46, 'Completed', '2026-04-27 15:14:26'),
(84, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302875/diagnoses/y60gd2ja8bu0o6tmxq7p.jpg', 99.94, 'Completed', '2026-04-27 15:14:34'),
(85, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302884/diagnoses/pad5s2bg176ytpeqnoly.jpg', 98.55, 'Completed', '2026-04-27 15:14:43'),
(86, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302890/diagnoses/fitt2aev9v2ctyrc0jeo.jpg', 99.74, 'Completed', '2026-04-27 15:14:50'),
(87, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302894/diagnoses/h8qmpqzem0gckrskfhjn.jpg', 98.55, 'Completed', '2026-04-27 15:14:54'),
(88, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302900/diagnoses/szcol7rtx8gjejbpkh0z.jpg', 99.76, 'Completed', '2026-04-27 15:14:59'),
(89, 0, 37, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302910/diagnoses/dvvb9lagwkxtoglsxm1a.jpg', 100.00, 'Completed', '2026-04-27 15:15:09'),
(90, 0, 37, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302916/diagnoses/ewjcdjtphbwetmkqacns.jpg', 99.98, 'Completed', '2026-04-27 15:15:16'),
(91, 0, 37, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302920/diagnoses/wwin45qfrwypd1altvza.jpg', 80.28, 'Completed', '2026-04-27 15:15:19'),
(92, 0, 73, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302930/diagnoses/td8s23ui19evdwgkpwgq.jpg', 100.00, 'Completed', '2026-04-27 15:15:30'),
(93, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302975/diagnoses/eysql22f8ose9ebyzsso.jpg', 100.00, 'Completed', '2026-04-27 15:16:14'),
(94, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302980/diagnoses/tamjaphrs2fn7tmedwam.jpg', 100.00, 'Completed', '2026-04-27 15:16:19'),
(95, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777302985/diagnoses/nhapfy1hkahmksayqmdl.jpg', 99.94, 'Completed', '2026-04-27 15:16:24'),
(96, 0, 68, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303103/diagnoses/urmzto2vphcpicxiwk7p.jpg', 100.00, 'Completed', '2026-04-27 15:18:22'),
(97, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303262/diagnoses/jncshkw2iob4afcjjasy.jpg', 99.94, 'Completed', '2026-04-27 15:21:02'),
(98, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303320/diagnoses/w7dplehuvf03ajyuw7sa.jpg', 31.83, 'Completed', '2026-04-27 15:22:00'),
(99, 0, 66, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303846/diagnoses/td5bbgklqpjarh5ajpj7.jpg', 99.57, 'Completed', '2026-04-27 15:30:48'),
(100, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303871/diagnoses/ege5edcpogn7lvfwsmp1.jpg', 100.00, 'Completed', '2026-04-27 15:31:10'),
(101, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303898/diagnoses/c99o1myjtenly6b1fz7i.jpg', 99.98, 'Completed', '2026-04-27 15:31:37'),
(102, 0, 10, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303899/diagnoses/jlosqefqqtznfu0oo1yg.jpg', 100.00, 'Completed', '2026-04-27 15:31:38'),
(103, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303906/diagnoses/k4igeefmwscxugzzrjbm.jpg', 100.00, 'Completed', '2026-04-27 15:31:45'),
(104, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303919/diagnoses/mjxciaicubga3jvixjtl.jpg', 100.00, 'Completed', '2026-04-27 15:31:58'),
(105, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303926/diagnoses/xssnceyg65qlopedcgjr.jpg', 100.00, 'Completed', '2026-04-27 15:32:05'),
(106, 0, 10, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303926/diagnoses/ozmep9nvyhniujh8nykc.jpg', 100.00, 'Completed', '2026-04-27 15:32:06'),
(107, 0, 77, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303932/diagnoses/roatgry3jxe1fecp8sdh.jpg', 79.82, 'Completed', '2026-04-27 15:32:11'),
(108, 0, 76, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303939/diagnoses/d7szdj4usijubv6vcznw.jpg', 96.75, 'Completed', '2026-04-27 15:32:18'),
(109, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777303940/diagnoses/wxp0c7drrwlnndkarqvv.jpg', 99.65, 'Completed', '2026-04-27 15:32:19'),
(110, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304140/diagnoses/cdyjsrvagq4wx28mlasm.png', 99.73, 'Completed', '2026-04-27 15:35:40'),
(111, 0, 73, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304159/diagnoses/amelgnhrvsr2idatpeod.jpg', 68.30, 'Completed', '2026-04-27 15:35:58'),
(112, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304161/diagnoses/jz5vghp2yqwhrxi1hhlq.jpg', 99.65, 'Completed', '2026-04-27 15:36:00'),
(113, 0, 1, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304168/diagnoses/mudqym7tsm5zb5jhtwa6.jpg', 99.90, 'Completed', '2026-04-27 15:36:07'),
(114, 0, 74, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304171/diagnoses/jtr0sq5xkwrzmrbuq07q.jpg', 84.93, 'Completed', '2026-04-27 15:36:10'),
(115, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304177/diagnoses/mkpak2w93suxca1mfzry.jpg', 82.46, 'Completed', '2026-04-27 15:36:17'),
(116, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304179/diagnoses/i5bbzujd2f8i3cznb7tv.jpg', 100.00, 'Completed', '2026-04-27 15:36:18'),
(117, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304183/diagnoses/aqnp5uuznwpkk22rtklc.jpg', 100.00, 'Completed', '2026-04-27 15:36:22'),
(118, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304185/diagnoses/fihxfyfuezesrgc0zlvz.jpg', 98.55, 'Completed', '2026-04-27 15:36:24'),
(119, 0, 3, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304189/diagnoses/kyks6n5t4pmuc8hy5qnp.jpg', 99.76, 'Completed', '2026-04-27 15:36:28'),
(120, 0, 75, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304192/diagnoses/ghgvfc4qlgzsxnlegbr6.jpg', 97.30, 'Completed', '2026-04-27 15:36:31'),
(121, 0, 3, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304193/diagnoses/qwt7q9edpaa95yztge5z.jpg', 99.74, 'Completed', '2026-04-27 15:36:33'),
(122, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304198/diagnoses/fmvjpwnktnvrxmfs31g5.jpg', 81.63, 'Completed', '2026-04-27 15:36:37'),
(123, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304200/diagnoses/lbz1jmurkg4obmzbqxaq.jpg', 99.95, 'Completed', '2026-04-27 15:36:39'),
(124, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304203/diagnoses/nfe1oo8byg4wzh1sg6c7.jpg', 81.38, 'Completed', '2026-04-27 15:36:42'),
(125, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304204/diagnoses/x83ue7aoparkgxeg2rjs.jpg', 99.99, 'Completed', '2026-04-27 15:36:43'),
(126, 0, 57, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304211/diagnoses/vpghgjrxc8ssofibylrp.jpg', 74.78, 'Completed', '2026-04-27 15:36:50'),
(127, 0, 4, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304214/diagnoses/ycykmnjyk9ormzab541d.jpg', 99.99, 'Completed', '2026-04-27 15:36:53'),
(128, 0, 57, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304215/diagnoses/lksavt7zxynhmfnkcnu8.jpg', 97.63, 'Completed', '2026-04-27 15:36:54'),
(129, 0, 57, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304219/diagnoses/un7dtia2kaaceqibvydp.jpg', 100.00, 'Completed', '2026-04-27 15:36:58'),
(130, 0, 4, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304220/diagnoses/dvvb2wpkmdaqn1qplr2g.jpg', 100.00, 'Completed', '2026-04-27 15:36:59'),
(131, 0, 78, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304227/diagnoses/jucvrxqcmczuddkzvtvt.jpg', 99.89, 'Completed', '2026-04-27 15:37:06'),
(132, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304227/diagnoses/nvce9welxm0e05iegnwy.jpg', 100.00, 'Completed', '2026-04-27 15:37:07'),
(133, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304232/diagnoses/rjdstuxuosp66tv3loht.jpg', 100.00, 'Completed', '2026-04-27 15:37:12'),
(134, 0, 79, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304236/diagnoses/auarnglctywv09kgg0dm.jpg', 94.51, 'Completed', '2026-04-27 15:37:15'),
(135, 0, 5, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304240/diagnoses/oeyiemtyk9caxcxdyvod.jpg', 100.00, 'Completed', '2026-04-27 15:37:19'),
(136, 0, 77, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304243/diagnoses/v93e3rapbz1kstknirzs.jpg', 67.02, 'Completed', '2026-04-27 15:37:23'),
(137, 0, 5, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304246/diagnoses/eshj9ipllhh2ch2laggy.jpg', 100.00, 'Completed', '2026-04-27 15:37:25'),
(138, 0, 77, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304248/diagnoses/f7ebtndojxlejabyuk2e.jpg', 98.81, 'Completed', '2026-04-27 15:37:28'),
(139, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304253/diagnoses/wdtildkgtzhr6jihng7a.jpg', 99.62, 'Completed', '2026-04-27 15:37:33'),
(140, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304259/diagnoses/orkv2wzm2g2w9sisxb6s.jpg', 62.95, 'Completed', '2026-04-27 15:37:39'),
(141, 0, 73, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304262/diagnoses/udo61guxllfvpzyxmri4.jpg', 96.81, 'Completed', '2026-04-27 15:37:41'),
(142, 0, 7, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304266/diagnoses/hhpdpcpvjcymh0spwhnp.jpg', 82.35, 'Completed', '2026-04-27 15:37:46'),
(143, 0, 73, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304269/diagnoses/y9khk3rd2ivr7cr1giiq.jpg', 100.00, 'Completed', '2026-04-27 15:37:48'),
(144, 0, 7, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304271/diagnoses/ws4nlx7agfgtmnmcovoq.jpg', 92.57, 'Completed', '2026-04-27 15:37:50'),
(145, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304276/diagnoses/g4fserp7mlbwtfaa0ynk.jpg', 100.00, 'Completed', '2026-04-27 15:37:55'),
(146, 0, 8, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304278/diagnoses/ax08tcjupmsf0zwg3chp.jpg', 95.18, 'Completed', '2026-04-27 15:37:57'),
(147, 0, 8, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304284/diagnoses/i6lstomcr0f6bb4yya8s.jpg', 99.99, 'Completed', '2026-04-27 15:38:03'),
(148, 0, 9, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304292/diagnoses/npubfb4hq22yrdjghnos.jpg', 93.79, 'Completed', '2026-04-27 15:38:11'),
(149, 0, 9, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304298/diagnoses/d3cojdxzjgbwdjia3fg0.jpg', 87.85, 'Completed', '2026-04-27 15:38:17'),
(150, 0, 24, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304336/diagnoses/x52rfwabtdw2ccspsani.jpg', 68.31, 'Completed', '2026-04-27 15:38:56'),
(151, 0, 67, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304398/diagnoses/gmyoigp4sabzyhum3udp.jpg', 100.00, 'Completed', '2026-04-27 15:39:57'),
(152, 0, 67, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304408/diagnoses/qejlqmbnpgoo483nbcux.jpg', 100.00, 'Completed', '2026-04-27 15:40:07'),
(153, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304415/diagnoses/juaunylpznpznwm54vvj.jpg', 100.00, 'Completed', '2026-04-27 15:40:14'),
(154, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304422/diagnoses/loy2pqtzrakwe2jfxut4.jpg', 99.98, 'Completed', '2026-04-27 15:40:22'),
(155, 0, 66, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304428/diagnoses/iqvrzdwaq9httoijuuek.jpg', 80.54, 'Completed', '2026-04-27 15:40:27'),
(156, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304430/diagnoses/zgsz7lkgo7mjbgs8ejuh.jpg', 100.00, 'Completed', '2026-04-27 15:40:29'),
(157, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304434/diagnoses/trpocccxemwetjzzmdtk.jpg', 100.00, 'Completed', '2026-04-27 15:40:33'),
(158, 0, 10, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304440/diagnoses/wnzskw9ioqzzdiqmwbry.jpg', 100.00, 'Completed', '2026-04-27 15:40:40'),
(159, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304444/diagnoses/zpbmxdqdogdoxmcsc9bs.jpg', 99.97, 'Completed', '2026-04-27 15:40:43'),
(160, 0, 10, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304449/diagnoses/iwuoivwianaog4iziple.jpg', 100.00, 'Completed', '2026-04-27 15:40:48'),
(161, 0, 11, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304457/diagnoses/relwfcmc7yabh1czmrns.jpg', 67.64, 'Completed', '2026-04-27 15:40:56'),
(162, 0, 11, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304466/diagnoses/fds4mcamgicp2kdici3v.jpg', 95.05, 'Completed', '2026-04-27 15:41:05'),
(163, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304467/diagnoses/bagouuuqvwg8boifb1xe.jpg', 98.87, 'Completed', '2026-04-27 15:41:07'),
(164, 0, 72, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304473/diagnoses/vussb93wtcwvjty7cmak.jpg', 97.42, 'Completed', '2026-04-27 15:41:12'),
(165, 0, 12, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304475/diagnoses/euojtn9zgkjfe6stkjyj.jpg', 100.00, 'Completed', '2026-04-27 15:41:15'),
(166, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304479/diagnoses/a9spsto3ehyoyrtfe00y.jpg', 100.00, 'Completed', '2026-04-27 15:41:18'),
(167, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304487/diagnoses/bbpyrcmat1lylsrjojgy.jpg', 100.00, 'Completed', '2026-04-27 15:41:26'),
(168, 0, 12, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304489/diagnoses/vvxjkqbcffosuhwfp6o0.jpg', 100.00, 'Completed', '2026-04-27 15:41:28'),
(169, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304496/diagnoses/rne6rf32smyy7tp8bsut.jpg', 99.99, 'Completed', '2026-04-27 15:41:36'),
(170, 0, 13, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304497/diagnoses/rj4qk0qtmv5clx1mok6k.jpg', 99.95, 'Completed', '2026-04-27 15:41:36'),
(171, 0, 13, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304502/diagnoses/lodie8kudv4uwikz5g2n.jpg', 63.67, 'Completed', '2026-04-27 15:41:42'),
(172, 0, 71, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304503/diagnoses/scu2mqbi0c5hzjm2f7ui.jpg', 50.61, 'Completed', '2026-04-27 15:41:43'),
(173, 0, 71, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304509/diagnoses/vjbubh7bvqchhkgdvihh.jpg', 100.00, 'Completed', '2026-04-27 15:41:48'),
(174, 0, 14, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304510/diagnoses/yp6lch19nh0ibqqdrrhb.jpg', 100.00, 'Completed', '2026-04-27 15:41:50'),
(175, 0, 70, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304518/diagnoses/mqs2efvs8laioxzfh7y9.jpg', 98.76, 'Completed', '2026-04-27 15:41:57'),
(176, 0, 14, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304523/diagnoses/phzz4l9ktislwlh4zq6o.jpg', 99.99, 'Completed', '2026-04-27 15:42:02'),
(177, 0, 70, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304528/diagnoses/u2dodwa2pxcwle8gmgn5.jpg', 99.33, 'Completed', '2026-04-27 15:42:08'),
(178, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304532/diagnoses/hxsmhfhfzhbiyjngyvku.jpg', 100.00, 'Completed', '2026-04-27 15:42:11'),
(179, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304538/diagnoses/f37hcn8cca8xyxeauacv.jpg', 99.99, 'Completed', '2026-04-27 15:42:17'),
(180, 0, 69, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304552/diagnoses/wslrrqc4qanigbf2jgr2.jpg', 100.00, 'Completed', '2026-04-27 15:42:31'),
(181, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304562/diagnoses/zgcnxh9pbxq2kzui0rqa.jpg', 99.96, 'Completed', '2026-04-27 15:42:41'),
(182, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304569/diagnoses/dmlyusyw6umcbgl3rm1v.jpg', 100.00, 'Completed', '2026-04-27 15:42:49'),
(183, 0, 80, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304576/diagnoses/muymshmtcipf8qo34bu5.jpg', 98.28, 'Completed', '2026-04-27 15:42:56'),
(184, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304600/diagnoses/w5zvalecytxlueo8cztn.jpg', 99.35, 'Completed', '2026-04-27 15:43:20'),
(185, 0, 65, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304608/diagnoses/oyhpqu23c9lalwt4gtrx.jpg', 100.00, 'Completed', '2026-04-27 15:43:27'),
(186, 0, 65, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304614/diagnoses/y6s1xac88tphwpw3phlp.jpg', 100.00, 'Completed', '2026-04-27 15:43:33'),
(187, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304621/diagnoses/u12ixelhx1tfwtktejym.jpg', 99.97, 'Completed', '2026-04-27 15:43:41'),
(188, 0, 64, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304629/diagnoses/cukmxdma2gd4iksi78un.jpg', 99.94, 'Completed', '2026-04-27 15:43:48'),
(189, 0, 15, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304634/diagnoses/wd3x82fc9k8z7lltswzj.jpg', 99.88, 'Completed', '2026-04-27 15:43:53'),
(190, 0, 25, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304640/diagnoses/dzctughlhrbx8dsgs2vz.jpg', 72.46, 'Completed', '2026-04-27 15:43:59'),
(191, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304641/diagnoses/vp15yprj1e5auujtrogh.jpg', 61.19, 'Completed', '2026-04-27 15:44:00'),
(192, 0, 25, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304647/diagnoses/kvzlesd01anc2vtzwhfd.jpg', 72.46, 'Completed', '2026-04-27 15:44:06'),
(193, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304649/diagnoses/mcr53nqbuzivujvgbhkv.jpg', 71.61, 'Completed', '2026-04-27 15:44:08'),
(194, 0, 15, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304653/diagnoses/ggafxtexqnt9y0fcwjih.jpg', 98.64, 'Completed', '2026-04-27 15:44:12'),
(195, 0, 63, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304661/diagnoses/en18mlzok1txhrmu8akw.jpg', 99.48, 'Completed', '2026-04-27 15:44:20'),
(196, 0, 17, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304663/diagnoses/v0crio59jhjhyw8jokpd.jpg', 99.88, 'Completed', '2026-04-27 15:44:23'),
(197, 0, 17, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304669/diagnoses/yccjbluesessfegdciho.jpg', 99.98, 'Completed', '2026-04-27 15:44:28'),
(198, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304670/diagnoses/gdyzxirukvkftm4l1ly0.jpg', 99.92, 'Completed', '2026-04-27 15:44:29'),
(199, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304677/diagnoses/mptdnnbjedv0n0c6asn3.jpg', 83.83, 'Completed', '2026-04-27 15:44:36'),
(200, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304677/diagnoses/o1epbzwjapweazodgqbr.jpg', 99.92, 'Completed', '2026-04-27 15:44:37'),
(201, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304684/diagnoses/njzpewygvagrz8er7tzb.jpg', 99.70, 'Completed', '2026-04-27 15:44:43'),
(202, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304685/diagnoses/iu3spklrs0qdue5atc9h.jpg', 97.68, 'Completed', '2026-04-27 15:44:44'),
(203, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304692/diagnoses/dvpn5vacpn2imy3njvp8.jpg', 90.77, 'Completed', '2026-04-27 15:44:51'),
(204, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304694/diagnoses/amwfgmgxkmipxjxdwtrb.jpg', 100.00, 'Completed', '2026-04-27 15:44:53'),
(205, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304695/diagnoses/fganccwrlbpjxp7kwsqd.jpg', 65.06, 'Completed', '2026-04-27 15:44:55'),
(206, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304701/diagnoses/lksmu68igut8zzgfzkvy.jpg', 99.88, 'Completed', '2026-04-27 15:45:00'),
(207, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304704/diagnoses/v2x6bi29tmwd62ir39lc.jpg', 99.99, 'Completed', '2026-04-27 15:45:04'),
(208, 0, 18, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304710/diagnoses/iwwhuwxso45ztg9rc6mh.jpg', 100.00, 'Completed', '2026-04-27 15:45:09'),
(209, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304710/diagnoses/ji4oxlsngfyrvlcnuvfu.jpg', 99.99, 'Completed', '2026-04-27 15:45:09'),
(210, 0, 18, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304715/diagnoses/awkh2xx4bpoijw8pfgcv.jpg', 100.00, 'Completed', '2026-04-27 15:45:15'),
(211, 0, 62, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304717/diagnoses/iswsltvvolnwdqpeteoz.jpg', 55.75, 'Completed', '2026-04-27 15:45:16'),
(212, 0, 21, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304724/diagnoses/baz1kigsnvtmo9fzwv8s.jpg', 97.76, 'Completed', '2026-04-27 15:45:23'),
(213, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304728/diagnoses/qvzat1bwszjr1qsewsb8.jpg', 97.13, 'Completed', '2026-04-27 15:45:28'),
(214, 0, 19, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304731/diagnoses/zxynfhizjzngglm4qr1i.jpg', 79.87, 'Completed', '2026-04-27 15:45:30'),
(215, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304736/diagnoses/pg1lh04vcuoq2odpzqjv.jpg', 99.74, 'Completed', '2026-04-27 15:45:36'),
(216, 0, 20, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304742/diagnoses/xorktsyjanhqmovrza7o.jpg', 100.00, 'Completed', '2026-04-27 15:45:41'),
(217, 0, 20, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304750/diagnoses/xxspz0fdp2grhivkmex0.jpg', 100.00, 'Completed', '2026-04-27 15:45:49'),
(218, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304759/diagnoses/px1c0ygk0kvlkenv4ofk.jpg', 100.00, 'Completed', '2026-04-27 15:45:58'),
(219, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304764/diagnoses/tswftot3etwn3rsmwlaf.jpg', 100.00, 'Completed', '2026-04-27 15:46:03'),
(220, 0, 21, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304771/diagnoses/f42fo692ghlukccmfrbi.jpg', 100.00, 'Completed', '2026-04-27 15:46:10'),
(221, 0, 61, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304772/diagnoses/rhbxj5bi7iiytu88kq4c.jpg', 98.82, 'Completed', '2026-04-27 15:46:11'),
(222, 0, 21, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304775/diagnoses/mu0irmmtctqx1b3pcwij.jpg', 63.96, 'Completed', '2026-04-27 15:46:15'),
(223, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304778/diagnoses/aifzbozwywanwjz9tv1s.jpg', 99.99, 'Completed', '2026-04-27 15:46:17'),
(224, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304783/diagnoses/ewyqhne686jogdagyy7g.jpg', 100.00, 'Completed', '2026-04-27 15:46:22'),
(225, 0, 60, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304784/diagnoses/kekf4cmbiqcqquzz1jpb.jpg', 99.99, 'Completed', '2026-04-27 15:46:23'),
(226, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304787/diagnoses/gyicycbktbteajv9xldu.jpg', 100.00, 'Completed', '2026-04-27 15:46:26'),
(227, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304791/diagnoses/inqcnti3snhw0nxgfnf8.jpg', 100.00, 'Completed', '2026-04-27 15:46:31'),
(228, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304792/diagnoses/ykabgcldro3zeqao7znv.jpg', 100.00, 'Completed', '2026-04-27 15:46:31'),
(229, 0, 59, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304800/diagnoses/gnlitqxihcehyb8bd9j5.jpg', 64.64, 'Completed', '2026-04-27 15:46:39'),
(230, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304822/diagnoses/ton2usd18urxiijljazy.jpg', 98.39, 'Completed', '2026-04-27 15:47:01'),
(231, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304829/diagnoses/o1f6aljmfmgos1oirxxf.jpg', 100.00, 'Completed', '2026-04-27 15:47:08'),
(232, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304838/diagnoses/iluahxlnu1ovhkbidumx.jpg', 100.00, 'Completed', '2026-04-27 15:47:17'),
(233, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304838/diagnoses/mryavs1ryxty1tsa1wdz.jpg', 70.60, 'Completed', '2026-04-27 15:47:18'),
(234, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304843/diagnoses/dy2qfscutdzsdhauq2g4.jpg', 77.06, 'Completed', '2026-04-27 15:47:22'),
(235, 0, 59, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304850/diagnoses/yu4xr55ejmgkzmstbrua.jpg', 96.47, 'Completed', '2026-04-27 15:47:29'),
(236, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304852/diagnoses/a5nhghreedzskshwt3lm.jpg', 62.37, 'Completed', '2026-04-27 15:47:31'),
(237, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304857/diagnoses/ohuseppmegnksqb60nns.jpg', 99.98, 'Completed', '2026-04-27 15:47:36'),
(238, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304863/diagnoses/z5mpcttout7k4egk2lxu.jpg', 62.37, 'Completed', '2026-04-27 15:47:42'),
(239, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304865/diagnoses/mx9bhl5htcfefaq9maxz.jpg', 67.43, 'Completed', '2026-04-27 15:47:44'),
(240, 0, 23, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304869/diagnoses/phm6rcbivlgvr5kzqglp.jpg', 71.97, 'Completed', '2026-04-27 15:47:48'),
(241, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304875/diagnoses/wrvlnuzh9euwnxxrly5b.jpg', 99.99, 'Completed', '2026-04-27 15:47:55'),
(242, 0, 23, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304877/diagnoses/mmedxuptyd3jbusjfsap.jpg', 90.39, 'Completed', '2026-04-27 15:47:56'),
(243, 0, 24, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304885/diagnoses/wehsxxrtbqezov6xx3pc.jpg', 99.56, 'Completed', '2026-04-27 15:48:05'),
(244, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304889/diagnoses/ky0st0gzxhwu4azgk6zp.jpg', 99.99, 'Completed', '2026-04-27 15:48:09'),
(245, 0, 27, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304891/diagnoses/mxszy32gqkd8eoqhlztv.jpg', 52.69, 'Completed', '2026-04-27 15:48:10'),
(246, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304896/diagnoses/xtxdfzh2lhdaxhbmmbgt.jpg', 94.44, 'Completed', '2026-04-27 15:48:16'),
(247, 0, 24, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304899/diagnoses/jyxeiixfuewt4xdh9fln.jpg', 99.98, 'Completed', '2026-04-27 15:48:18'),
(248, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304903/diagnoses/e39j5r3rngfbaoemtmir.jpg', 86.30, 'Completed', '2026-04-27 15:48:23'),
(249, 0, 25, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304907/diagnoses/c43r45odjwtjglqnicgz.jpg', 99.20, 'Completed', '2026-04-27 15:48:26'),
(250, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304911/diagnoses/yktqilmslxkjszcdlwgx.jpg', 99.87, 'Completed', '2026-04-27 15:48:30'),
(251, 0, 25, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304913/diagnoses/ixskyeh2vaxqngmsk7jm.jpg', 92.29, 'Completed', '2026-04-27 15:48:32'),
(252, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304918/diagnoses/qdnoiy04cx2p5y0lwgrs.jpg', 99.36, 'Completed', '2026-04-27 15:48:38'),
(253, 0, 26, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304921/diagnoses/kuxbnvkc5rym7qfhewsf.jpg', 97.92, 'Completed', '2026-04-27 15:48:40'),
(254, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304924/diagnoses/nicly0rp7gy9p7wi5ivn.jpg', 98.92, 'Completed', '2026-04-27 15:48:43'),
(255, 0, 26, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304927/diagnoses/xgpevornbb5oallh5ui5.jpg', 80.95, 'Completed', '2026-04-27 15:48:46'),
(256, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304928/diagnoses/xnbzwc8kuba3zuimfl5t.jpg', 99.98, 'Completed', '2026-04-27 15:48:47'),
(257, 0, 27, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304936/diagnoses/h3nafu2ln8avbpotvxgx.jpg', 99.70, 'Completed', '2026-04-27 15:48:55'),
(258, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304937/diagnoses/pgugjl8v8y6al7v47aoh.jpg', 100.00, 'Completed', '2026-04-27 15:48:56'),
(259, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304941/diagnoses/wafocwtljvy8y082g9z8.jpg', 100.00, 'Completed', '2026-04-27 15:49:00'),
(260, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304942/diagnoses/a8wsappkhofqmvpvsqjf.jpg', 75.42, 'Completed', '2026-04-27 15:49:01'),
(261, 0, 27, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304948/diagnoses/edhuefz2gm1fhkbqydyl.jpg', 95.51, 'Completed', '2026-04-27 15:49:07'),
(262, 0, 28, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304955/diagnoses/jnjhpvicyxtflfkdygk2.jpg', 99.99, 'Completed', '2026-04-27 15:49:15'),
(263, 0, 28, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304961/diagnoses/ncsxug1wbjcfrzet9ihz.jpg', 100.00, 'Completed', '2026-04-27 15:49:20'),
(264, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304983/diagnoses/u3dm9wwvua1rcbeejcks.jpg', 99.09, 'Completed', '2026-04-27 15:49:42'),
(265, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304988/diagnoses/grlnhpys5basynbdxoft.jpg', 99.98, 'Completed', '2026-04-27 15:49:47'),
(266, 0, 57, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777304994/diagnoses/ieidtamwnhhl56wj9ibe.jpg', 99.99, 'Completed', '2026-04-27 15:49:54'),
(267, 0, 29, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305004/diagnoses/p9b3pylpl34gs21ouzvr.jpg', 99.75, 'Completed', '2026-04-27 15:50:03'),
(268, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305019/diagnoses/jgisn5kwemmmjgzilsly.jpg', 100.00, 'Completed', '2026-04-27 15:50:18'),
(269, 0, 29, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305025/diagnoses/jzoeuv1zwcqhpyyzfii5.jpg', 100.00, 'Completed', '2026-04-27 15:50:24'),
(270, 0, 56, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305026/diagnoses/l6in4c4meeqfyluedpgp.jpg', 99.99, 'Completed', '2026-04-27 15:50:26'),
(271, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305032/diagnoses/v5n3ijmvw2h6a0osfkfq.jpg', 43.29, 'Completed', '2026-04-27 15:50:31'),
(272, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305033/diagnoses/waztmq0djrfth3vkfnrj.jpg', 100.00, 'Completed', '2026-04-27 15:50:32'),
(273, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305036/diagnoses/sdd6va7gu2hypsfun0vt.jpg', 100.00, 'Completed', '2026-04-27 15:50:35'),
(274, 0, 56, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305037/diagnoses/lzjkkqfvnixbbtjjdwtq.jpg', 92.58, 'Completed', '2026-04-27 15:50:36'),
(275, 0, 56, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305041/diagnoses/i5yhfzcxgnq7i6pkkexu.jpg', 47.02, 'Completed', '2026-04-27 15:50:40'),
(276, 0, 56, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305045/diagnoses/sgcbabsspzxeds5rkm8d.jpg', 62.27, 'Completed', '2026-04-27 15:50:44'),
(277, 0, 30, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305048/diagnoses/ihsepe93j78knlssvniv.jpg', 100.00, 'Completed', '2026-04-27 15:50:47'),
(278, 0, 56, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305049/diagnoses/ft1azl2epwip9qquwjp5.jpg', 99.97, 'Completed', '2026-04-27 15:50:48'),
(279, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305065/diagnoses/ccvuwyr6llmvbhvkwttc.jpg', 99.99, 'Completed', '2026-04-27 15:51:05'),
(280, 0, 30, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305066/diagnoses/sfe0alushnudqkdjrhuj.jpg', 100.00, 'Completed', '2026-04-27 15:51:05'),
(281, 0, 31, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305075/diagnoses/jrlri4kqtnkxddtkc1tl.jpg', 98.99, 'Completed', '2026-04-27 15:51:15'),
(282, 0, 31, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305083/diagnoses/jfp9hvijshywmzrjs8db.jpg', 98.82, 'Completed', '2026-04-27 15:51:22'),
(283, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305099/diagnoses/lqu1e7vruda8oxlzgodr.jpg', 99.58, 'Completed', '2026-04-27 15:51:38'),
(284, 0, 32, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305105/diagnoses/wfx09ofdtaudrq7fthmn.jpg', 98.49, 'Completed', '2026-04-27 15:51:44'),
(285, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305106/diagnoses/edrbxugpqfvhpf7o6kjo.jpg', 100.00, 'Completed', '2026-04-27 15:51:45'),
(286, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305112/diagnoses/kptaycj1nnfr4rv7jxe8.jpg', 51.23, 'Completed', '2026-04-27 15:51:52'),
(287, 0, 55, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305116/diagnoses/x1axanwftsql27i4yods.jpg', 99.99, 'Completed', '2026-04-27 15:51:55'),
(288, 0, 32, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305124/diagnoses/hhgqzxmhaifefhqgkuv1.jpg', 99.97, 'Completed', '2026-04-27 15:52:04'),
(289, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305125/diagnoses/texi3ypg742mtmixa61k.jpg', 100.00, 'Completed', '2026-04-27 15:52:04'),
(290, 0, 54, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305132/diagnoses/wjddjntwiuucuczczprf.jpg', 100.00, 'Completed', '2026-04-27 15:52:11'),
(291, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305142/diagnoses/kfgobhfkfpkqyxxvgb4d.jpg', 99.20, 'Completed', '2026-04-27 15:52:21'),
(292, 0, 36, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305147/diagnoses/t8nn2aihygnrr2q5ufit.jpg', 99.97, 'Completed', '2026-04-27 15:52:26'),
(293, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305150/diagnoses/exyknyqmob7mvcmlnp4v.jpg', 99.98, 'Completed', '2026-04-27 15:52:29'),
(294, 0, 52, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305154/diagnoses/mgmku6fidy9iyebwfvpa.jpg', 97.03, 'Completed', '2026-04-27 15:52:33'),
(295, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305164/diagnoses/ffx3ibec0iebq4udxiap.jpg', 88.29, 'Completed', '2026-04-27 15:52:43'),
(296, 0, 33, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305166/diagnoses/w33cs9oln8nq0kyvbwyl.jpg', 99.99, 'Completed', '2026-04-27 15:52:46'),
(297, 0, 52, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305173/diagnoses/oaqwwmwmaxhvhvh5zvat.jpg', 88.65, 'Completed', '2026-04-27 15:52:52'),
(298, 0, 33, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305173/diagnoses/uwmngtvalc9kxwgeiisg.jpg', 99.75, 'Completed', '2026-04-27 15:52:53'),
(299, 0, 51, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305181/diagnoses/dwnd0d6prj34ymxnb33s.jpg', 99.96, 'Completed', '2026-04-27 15:53:00'),
(300, 0, 34, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305182/diagnoses/huruvxkd6zjvgw3yhdcn.jpg', 99.71, 'Completed', '2026-04-27 15:53:01'),
(301, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305188/diagnoses/hdyayw9cioqfgrzfa0ci.jpg', 99.74, 'Completed', '2026-04-27 15:53:07'),
(302, 0, 32, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305189/diagnoses/ktwfgjfzfo00pbupuyya.jpg', 95.38, 'Completed', '2026-04-27 15:53:08'),
(303, 0, 40, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305195/diagnoses/zgi26q9hrpjwny5qrgci.jpg', 100.00, 'Completed', '2026-04-27 15:53:15'),
(304, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305201/diagnoses/cbrtxt50xyvnnqljabxs.jpg', 99.99, 'Completed', '2026-04-27 15:53:20'),
(305, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305204/diagnoses/gwjhdomzktmuek0gnxux.jpg', 99.96, 'Completed', '2026-04-27 15:53:23'),
(306, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305206/diagnoses/wfeilt9cjzhkwujxwfjp.jpg', 99.96, 'Completed', '2026-04-27 15:53:25'),
(307, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305214/diagnoses/mxph2j9k2sdci72fde2e.jpg', 99.79, 'Completed', '2026-04-27 15:53:33'),
(308, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305218/diagnoses/llcdwl5blqmcrjmblonv.jpg', 99.99, 'Completed', '2026-04-27 15:53:37'),
(309, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305219/diagnoses/o0nvkfhc51u9evt4fzy7.jpg', 99.99, 'Completed', '2026-04-27 15:53:38'),
(310, 0, 50, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305223/diagnoses/mc9ieyeezz9nudrhxmky.jpg', 100.00, 'Completed', '2026-04-27 15:53:43'),
(311, 0, 36, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305226/diagnoses/wpkythxyoq3epsumowji.jpg', 99.94, 'Completed', '2026-04-27 15:53:45'),
(312, 0, 49, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305231/diagnoses/ej3wuymjseuetdjtq9go.jpg', 100.00, 'Completed', '2026-04-27 15:53:51'),
(313, 0, 36, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305232/diagnoses/lmzn0m3ymkmvy0rai5rg.jpg', 99.99, 'Completed', '2026-04-27 15:53:51'),
(314, 0, 48, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305238/diagnoses/z9msre8xfyayzevs61zj.jpg', 100.00, 'Completed', '2026-04-27 15:53:57'),
(315, 0, 37, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305239/diagnoses/wv1cnopiyjt8gwcqi09x.jpg', 100.00, 'Completed', '2026-04-27 15:53:58'),
(316, 0, 81, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305245/diagnoses/asgojiqjw4mctmiknooy.jpg', 99.70, 'Completed', '2026-04-27 15:54:04'),
(317, 0, 37, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305245/diagnoses/wpf7946eumzbhnlb9wy8.jpg', 100.00, 'Completed', '2026-04-27 15:54:04'),
(318, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305252/diagnoses/rc5xrbsgjyyclfjlp5xo.jpg', 99.97, 'Completed', '2026-04-27 15:54:11'),
(319, 0, 38, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305254/diagnoses/kiegbw2hpncuapnctats.jpg', 95.77, 'Completed', '2026-04-27 15:54:13'),
(320, 0, 47, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305259/diagnoses/nahwwns65xxepfvqnovt.jpg', 84.28, 'Completed', '2026-04-27 15:54:18'),
(321, 0, 38, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305262/diagnoses/hxyjshh68tvnlakkplkp.jpg', 91.44, 'Completed', '2026-04-27 15:54:21'),
(322, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305264/diagnoses/wvamgfwbjmtmmzy415tc.jpg', 54.36, 'Completed', '2026-04-27 15:54:23'),
(323, 0, 46, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305274/diagnoses/zwrcvh0jpncdk9mbkryq.jpg', 100.00, 'Completed', '2026-04-27 15:54:33'),
(324, 0, 46, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305281/diagnoses/cnqffisyl3a4at4hwjm3.jpg', 100.00, 'Completed', '2026-04-27 15:54:40'),
(325, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305288/diagnoses/ybzqyyz3ii16dviwsyrn.jpg', 49.33, 'Completed', '2026-04-27 15:54:47');
INSERT INTO `imagediagnoses` (`DiagnosisId`, `UserId`, `DiseaseId`, `ImageUrl`, `ConfidencePercent`, `Status`, `CreatedAt`) VALUES
(326, 0, 45, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305295/diagnoses/d6zsimhlfhabtxlf3ckq.jpg', 92.78, 'Completed', '2026-04-27 15:54:54'),
(327, 0, 39, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305296/diagnoses/kwyxkh6gptokxfs4xgsr.jpg', 99.98, 'Completed', '2026-04-27 15:54:55'),
(328, 0, 39, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305302/diagnoses/e5iyq4vmjexsjy8f7x61.jpg', 100.00, 'Completed', '2026-04-27 15:55:01'),
(329, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305303/diagnoses/nvh6hl2pvuyos4gggkv9.jpg', 49.33, 'Completed', '2026-04-27 15:55:03'),
(330, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305310/diagnoses/flkbiagrqgnw4drjpcwe.jpg', 89.47, 'Completed', '2026-04-27 15:55:09'),
(331, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305316/diagnoses/kzhh3cul673b6fi96avw.jpg', 99.99, 'Completed', '2026-04-27 15:55:16'),
(332, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305318/diagnoses/usk6m0yrled19dwhacag.jpg', 99.81, 'Completed', '2026-04-27 15:55:17'),
(333, 0, 16, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305325/diagnoses/e828gsdmg4ktmzhbpavj.jpg', 95.46, 'Completed', '2026-04-27 15:55:24'),
(334, 0, 36, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305333/diagnoses/httfi3ry6uijzpuvyr56.jpg', 22.28, 'Completed', '2026-04-27 15:55:32'),
(335, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305338/diagnoses/jm1qeao0y7rynjkqtivk.jpg', 99.98, 'Completed', '2026-04-27 15:55:37'),
(336, 0, 42, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305339/diagnoses/kgre459jgid65b2shbzu.jpg', 67.57, 'Completed', '2026-04-27 15:55:38'),
(337, 0, 47, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305344/diagnoses/a65cc2tkws5hlwiqndxx.jpg', 80.29, 'Completed', '2026-04-27 15:55:43'),
(338, 0, 40, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305347/diagnoses/fm39lxhyfpfzmtrgb1rt.jpg', 100.00, 'Completed', '2026-04-27 15:55:46'),
(339, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305351/diagnoses/xiwjfazejyf3amhwerpr.jpg', 45.62, 'Completed', '2026-04-27 15:55:50'),
(340, 0, 40, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305354/diagnoses/divpfn5dbkvmtsgzvsvj.jpg', 100.00, 'Completed', '2026-04-27 15:55:54'),
(341, 0, 40, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305364/diagnoses/yxejfx66tfesadaomhs6.jpg', 100.00, 'Completed', '2026-04-27 15:56:03'),
(342, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305368/diagnoses/aevcn1bvgv0fbfcql3pl.jpg', 99.53, 'Completed', '2026-04-27 15:56:07'),
(343, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305409/diagnoses/w6ysoovwufiqg0iabvxe.png', 100.00, 'Completed', '2026-04-27 15:56:48'),
(344, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305638/diagnoses/ohakotlx6kccgxkissk4.png', 100.00, 'Completed', '2026-04-27 16:00:38'),
(345, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305698/diagnoses/uauii8r1ivviadadsy0o.png', 100.00, 'Completed', '2026-04-27 16:01:38'),
(346, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305781/diagnoses/tb6m08gaasib5pw1g96e.jpg', 99.94, 'Completed', '2026-04-27 16:03:00'),
(347, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305806/diagnoses/wcscjtekdg3m0czpjbcx.png', 100.00, 'Completed', '2026-04-27 16:03:26'),
(348, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305829/diagnoses/bwlftovcrmh0mwzs1sct.jpg', 99.94, 'Completed', '2026-04-27 16:03:48'),
(349, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305837/diagnoses/xrazlumpco91ukitrtcm.jpg', 99.95, 'Completed', '2026-04-27 16:03:56'),
(350, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777305962/diagnoses/bthunnitwkq7my6kx4ek.jpg', 99.98, 'Completed', '2026-04-27 16:06:01'),
(351, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777306001/diagnoses/q0im7fgy0nphufvtfuoh.jpg', 99.99, 'Completed', '2026-04-27 16:06:40'),
(352, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777306060/diagnoses/apzx76r2kb9rtadp09v8.png', 100.00, 'Completed', '2026-04-27 16:07:39'),
(353, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777306178/diagnoses/jvf4vjdbgmqhxpgo2oux.jpg', 99.99, 'Completed', '2026-04-27 16:09:37'),
(354, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777306289/diagnoses/tejj0kopk2silo6mbvoo.jpg', 100.00, 'Completed', '2026-04-27 16:11:28'),
(355, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777308421/diagnoses/fnxrvkapl6gxoyqvohuv.jpg', 93.16, 'Completed', '2026-04-27 16:47:01'),
(356, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777309249/diagnoses/uxz85tzx9qwkwush8jf6.jpg', 99.96, 'Completed', '2026-04-27 17:00:49'),
(357, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310652/diagnoses/gumjd5vyobkjstecijao.jpg', 59.83, 'Completed', '2026-04-27 17:24:12'),
(358, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310661/diagnoses/nd6kcqyxazzklyzm1d2w.jpg', 98.45, 'Completed', '2026-04-27 17:24:20'),
(359, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310674/diagnoses/kppr2yxpl60hlrxpag7e.jpg', 59.83, 'Completed', '2026-04-27 17:24:33'),
(360, 0, 31, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310688/diagnoses/jroxdvkphbezpvkowxdi.jpg', 88.91, 'Completed', '2026-04-27 17:24:47'),
(361, 0, 7, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310694/diagnoses/gv6vegbraerg0kt3d739.jpg', 92.34, 'Completed', '2026-04-27 17:24:53'),
(362, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777310699/diagnoses/tbtpgxudccanxlu5llwv.jpg', 99.78, 'Completed', '2026-04-27 17:24:58'),
(363, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458412/diagnoses/wkgmezaht6z1pujwyymy.jpg', 100.00, 'Completed', '2026-05-11 00:13:37'),
(364, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458438/diagnoses/d3svbjgtippheeie2ctn.jpg', 100.00, 'Completed', '2026-05-11 00:13:57'),
(365, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458448/diagnoses/xabyoujg6nd0ctilrhya.webp', 88.96, 'Completed', '2026-05-11 00:14:08'),
(366, 0, 5, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458489/diagnoses/r1pblhbisbbmbpt8wojc.webp', 96.68, 'Completed', '2026-05-11 00:14:49'),
(367, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458674/diagnoses/aq3seh2lqnx25fmbzsxu.jpg', 99.09, 'Completed', '2026-05-11 00:17:54'),
(368, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458697/diagnoses/nahixqhiftbzoqkkppan.jpg', 99.49, 'Completed', '2026-05-11 00:18:17'),
(369, 0, 2, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458731/diagnoses/pj0sqhvwkaa1m2g9a7gt.jpg', 65.62, 'Completed', '2026-05-11 00:18:51'),
(370, 0, 82, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1778458762/diagnoses/v2boo5bk3ropcqzslixt.jpg', 100.00, 'Completed', '2026-05-11 00:19:22'),
(371, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779048876/diagnoses/pz3eyr6ltnfviexcd31h.jpg', 100.00, 'Completed', '2026-05-17 20:14:41'),
(372, 0, 68, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049064/diagnoses/ti8pn4qbw4bzvd0frc47.jpg', 61.36, 'Completed', '2026-05-17 20:17:45'),
(373, 0, 11, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049102/diagnoses/zdmfn71stqihkzvqnubi.jpg', 44.27, 'Completed', '2026-05-17 20:18:22'),
(374, 0, 68, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049121/diagnoses/wvltxpaguc49cop9i23m.png', 61.11, 'Completed', '2026-05-17 20:18:41'),
(375, 0, 35, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049147/diagnoses/urjwyssb5rlbsnarecjf.jpg', 93.29, 'Completed', '2026-05-17 20:19:08'),
(376, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049163/diagnoses/ssnqzvazo1larn8jqjtu.jpg', 99.99, 'Completed', '2026-05-17 20:19:23'),
(377, 0, 41, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049177/diagnoses/jod6ikgafimemkaf7er2.jpg', 100.00, 'Completed', '2026-05-17 20:19:37'),
(378, 0, 68, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049203/diagnoses/cwwrlw9h77i2fwsue532.jpg', 61.36, 'Completed', '2026-05-17 20:20:03'),
(379, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049281/diagnoses/jq9hhksdrcltj7fwwcb1.jpg', 98.76, 'Completed', '2026-05-17 20:21:21'),
(380, 0, 5, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049337/diagnoses/lsgr7sb849mxnqw8rsjf.jpg', 83.12, 'Completed', '2026-05-17 20:22:18'),
(381, 0, 22, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779049414/diagnoses/r7s4beeztpms09wfygk9.jpg', 99.96, 'Completed', '2026-05-17 20:23:34'),
(382, 0, 83, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779382997/diagnoses/etbm6m72tvrt7wvxxavi.png', 99.98, 'Completed', '2026-05-21 17:03:20'),
(383, 0, 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779383031/diagnoses/tldvuydbc5cg4oanfeur.jpg', 98.47, 'Completed', '2026-05-21 17:03:50'),
(384, 0, 48, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779383048/diagnoses/mdqzxbdn22ntuxpatu1x.jpg', 100.00, 'Completed', '2026-05-21 17:04:06'),
(385, 0, 52, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1779383067/diagnoses/u9rqyultexulgnxfqbb1.jpg', 99.68, 'Completed', '2026-05-21 17:04:25');

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

CREATE TABLE `likes` (
  `LikeId` int(11) NOT NULL,
  `PostId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `likes`
--

INSERT INTO `likes` (`LikeId`, `PostId`, `UserId`, `CreatedAt`) VALUES
(7, 15, 7, '2026-04-24 16:15:28'),
(9, 15, 1, '2026-04-24 16:26:02'),
(10, 17, 10, '2026-04-25 00:11:11'),
(11, 17, 1, '2026-04-25 00:17:12'),
(12, 14, 1, '2026-04-27 12:07:53'),
(18, 16, 1, '2026-05-20 22:39:28');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `NotificationId` bigint(20) NOT NULL,
  `ReceiverUserId` bigint(20) NOT NULL,
  `ActorUserId` bigint(20) NOT NULL,
  `PostId` bigint(20) NOT NULL,
  `Type` longtext NOT NULL,
  `Message` longtext NOT NULL,
  `IsRead` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`NotificationId`, `ReceiverUserId`, `ActorUserId`, `PostId`, `Type`, `Message`, `IsRead`, `CreatedAt`) VALUES
(1, 15, 16, 30, 'like', 'Someone liked your post', 1, '2026-05-17 01:54:53.484228'),
(2, 15, 16, 29, 'like', 'Someone liked your post', 1, '2026-05-17 01:54:54.636714'),
(3, 15, 16, 28, 'like', 'Someone liked your post', 1, '2026-05-17 01:54:55.998779'),
(4, 15, 16, 29, 'comment', 'Someone commented on your post', 1, '2026-05-17 01:55:02.442636'),
(5, 15, 16, 30, 'comment', 'Someone commented on your post', 1, '2026-05-17 01:55:06.450295'),
(6, 15, 16, 30, 'comment', 'Someone commented on your post', 1, '2026-05-17 01:55:08.220310'),
(7, 15, 1, 31, 'comment', 'Someone commented on your post', 1, '2026-05-17 20:01:29.800613'),
(8, 15, 1, 31, 'like', 'Someone liked your post', 1, '2026-05-17 20:01:33.516217'),
(9, 15, 1, 31, 'comment', 'Someone commented on your post', 1, '2026-05-17 20:02:54.179565'),
(10, 8, 1, 16, 'like', 'Someone liked your post', 0, '2026-05-20 22:39:28.655326'),
(11, 1, 17, 33, 'like', 'Someone liked your post', 1, '2026-05-23 12:51:04.363582'),
(12, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 12:51:08.861713'),
(13, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 12:59:24.089486'),
(14, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 12:59:42.551476'),
(15, 1, 17, 33, 'like', 'Someone liked your post', 1, '2026-05-23 13:00:33.674042'),
(16, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:01:00.048413'),
(17, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:01:16.758291'),
(18, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:03:10.640207'),
(19, 1, 17, 33, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:03:59.470053'),
(20, 1, 17, 36, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:11:46.102106'),
(21, 1, 17, 36, 'like', 'Someone liked your post', 1, '2026-05-23 13:11:50.332090'),
(22, 1, 17, 37, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:39:52.743005'),
(23, 1, 17, 37, 'like', 'Someone liked your post', 1, '2026-05-23 13:39:55.840732'),
(24, 1, 17, 37, 'comment', 'Someone commented on your post', 1, '2026-05-23 13:45:19.973292');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `PostId` int(11) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Content` text NOT NULL,
  `UserId` int(11) NOT NULL,
  `ImageUrl` varchar(500) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `Category` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`PostId`, `Title`, `Content`, `UserId`, `ImageUrl`, `CreatedAt`, `Category`) VALUES
(14, 'Shhs', 'Ahhhs', 6, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777042738/posts/x5w4wourwmg6zsfyo5rg.jpg', '2026-04-24 14:58:57', ' Sustainability'),
(15, 'hi', 'في The Last of Us، الفطر Cordyceps دمّر البشرية. 🍄\r\nفي العالم الحقيقي، الفطريات بتدمّر محاصيلنا كل يوم.\r\nالفرق؟ إحنا عنا Dr. Plant 🌱\r\n#SaveThePlants', 7, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777047047/posts/zxwzhrplbbyrjyvsenc7.jpg', '2026-04-24 16:10:45', ' Sustainability'),
(16, 'clawd>>>>', '1 2 3 ......', 8, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777047559/posts/wrbhrktiqvwzm7ssgnwo.jpg', '2026-04-24 16:19:18', 'General'),
(17, 'هل ما يحدث لنباتتي طبيعي أم علامة مرض؟ 🤔🌿', 'لاحظت تغيّرات مفاجئة في أوراقها، وأود معرفة السبب المحتمل وعلاجه', 9, 'https://res.cloudinary.com/dniyjktlo/image/upload/v1777066450/posts/otncgu8uryv62dzq2pzy.jpg', '2026-04-24 21:34:10', 'Pest Control');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserId` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `Role` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserId`, `email`, `Name`, `FirstName`, `LastName`, `PasswordHash`, `CreatedAt`, `Role`) VALUES
(1, 'admin@gmail.com', 'Yazan Arar', 'Yazan', 'Arar', '$2a$11$4Od59eoyIm7qC5AGawAVeOwaEPQf6RsSFblwajnLAS6ugEb4FBMZe', '2026-04-24 13:33:49', 'admin'),
(6, 'Adamshtayyeh77@gmail.com', 'adam hamode', 'adam', 'hamode', '$2a$11$wsk8cGbdyly1E2mR1ZEvl.lolRc.VXOgX5ACypHP3umnqnYtyPhIK', '2026-04-24 14:15:57', 'user'),
(7, 'ibraheemsuwan98@gmail.com', 'ibraheem suwan', 'ibraheem', 'suwan', '$2a$11$PFeYNyRs4D/wne2xxeZ8iunMMbzedPtjtnazohHlNndd7w3vMim/e', '2026-04-24 16:00:04', 'user'),
(8, 'ahmadalgzawi99@gmail.com', 'Ahmad Gzawi', 'Ahmad', 'Gzawi', '$2a$11$qhqzdLpW5qxSL.ixgvtD7Oxe0B6Fm2kE0spsFIuthby.XbtTwkUUG', '2026-04-24 16:04:21', 'user'),
(9, 'ADAMt@GMAIL.COM', 'ADAM TEST', 'ADAM', 'TEST', '$2a$11$Q7dyn3oMJLIL1s3ALHSjqu7eUU5Uwg/Hn0UbBjHTOL24otwgW0Wua', '2026-04-24 21:30:05', 'user'),
(10, 'yousef10@gmail.com', 'Yousf Arar', 'Yousf', 'Arar', '$2a$11$LcvypwK4Rcn1JmJ6f75VN.gF9yGP/.RpOk0uS4AKLcG4jfFNG2oTy', '2026-04-25 00:09:39', 'user'),
(11, 'ahmadshon87@gmail.com', 'Ahmad Shon', 'Ahmad', 'Shon', '$2a$11$VEOYqWQKaVIYaCYkww2hxudKB51NHntcucnzejHxKD2j6wJwDAZyi', '2026-04-25 17:13:32', 'user'),
(12, 'yazansh@gmail.com', 'Yazan Shtayyeh', 'Yazan', 'Shtayyeh', '$2a$11$oIqZApMQYm4HnexqzdSBNOx80adg4DvFh80LWpotgJkrP.tIIc0b6', '2026-04-27 15:20:28', 'user'),
(13, 'adamshtayyeh@gmail.com', 'Adam Hamode', 'Adam', 'Hamode', '$2a$11$k.USqB6Wt1jHx7O7dUNAVur28x4a/Bgfe2tMCEjgNyFFA5y.Anhou', '2026-05-11 00:13:24', 'user'),
(14, 'asas@gmail.com', 'aa ss', 'aa', 'ss', '$2a$11$ZHx2yIqMwDda8IZj93lp/elbXJ4den0DOKMlN52wKxZlwkNTV2d5S', '2026-05-17 00:42:49', 'user'),
(15, 'yazanarar59@gmail.com', 'Yazan Arar', 'Yazan', 'Arar', '$2a$11$oc3aYUUIITFZ7JeCUIgEVO1RHP.GfAb0ME0IdNlDsOmbxB1og5XqS', '2026-05-17 00:50:16', 'user'),
(16, 'yazanarar32@gmail.com', 'Yazan Arar', 'Yazan', 'Arar', '$2a$11$PLWDKWqH2qzMl0kry6Yk2Ov1GOTMO0Rq0i2g0iMNhIZNbjsdHX7k6', '2026-05-17 01:54:48', 'user'),
(17, 'ahmad@gmail.com', 'Ahmad Alia', 'Ahmad', 'Alia', '$2a$11$v75cM5saDrpM59mfkMdy1eTXfWW5.HHHZH2iXs5kvPPphBI2hHpai', '2026-05-23 12:50:51', 'user');

-- --------------------------------------------------------

--
-- Table structure for table `__efmigrationshistory`
--

CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) NOT NULL,
  `ProductVersion` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `__efmigrationshistory`
--

INSERT INTO `__efmigrationshistory` (`MigrationId`, `ProductVersion`) VALUES
('20260426143306_AddContactMessagesTable', '8.0.2'),
('20260426155802_AddCategoryToPosts', '8.0.2'),
('20260517002925_AddRoleToUsers', '8.0.2'),
('20260517013730_AddNotificationsTable', '8.0.2');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`CommentId`),
  ADD KEY `fk_comments_post` (`PostId`),
  ADD KEY `fk_comments_user` (`UserId`);

--
-- Indexes for table `contactmessages`
--
ALTER TABLE `contactmessages`
  ADD PRIMARY KEY (`Id`);

--
-- Indexes for table `cropdetails`
--
ALTER TABLE `cropdetails`
  ADD PRIMARY KEY (`CropDetailsId`),
  ADD UNIQUE KEY `IX_CropDetails_CropId` (`CropId`);

--
-- Indexes for table `cropdiseases`
--
ALTER TABLE `cropdiseases`
  ADD PRIMARY KEY (`CropId`,`DiseaseId`),
  ADD KEY `fk_cropdiseases_disease` (`DiseaseId`);

--
-- Indexes for table `crops`
--
ALTER TABLE `crops`
  ADD PRIMARY KEY (`CropId`),
  ADD KEY `fk_crops_user` (`UserId`);

--
-- Indexes for table `diseases`
--
ALTER TABLE `diseases`
  ADD PRIMARY KEY (`DiseaseId`);

--
-- Indexes for table `imagediagnoses`
--
ALTER TABLE `imagediagnoses`
  ADD PRIMARY KEY (`DiagnosisId`),
  ADD KEY `fk_diag_user` (`UserId`),
  ADD KEY `fk_diag_disease` (`DiseaseId`);

--
-- Indexes for table `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`LikeId`),
  ADD UNIQUE KEY `uq_likes_post_user` (`PostId`,`UserId`),
  ADD KEY `fk_likes_user` (`UserId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`NotificationId`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`PostId`),
  ADD KEY `fk_posts_user` (`UserId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `__efmigrationshistory`
--
ALTER TABLE `__efmigrationshistory`
  ADD PRIMARY KEY (`MigrationId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `CommentId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `contactmessages`
--
ALTER TABLE `contactmessages`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `cropdetails`
--
ALTER TABLE `cropdetails`
  MODIFY `CropDetailsId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `crops`
--
ALTER TABLE `crops`
  MODIFY `CropId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `diseases`
--
ALTER TABLE `diseases`
  MODIFY `DiseaseId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `imagediagnoses`
--
ALTER TABLE `imagediagnoses`
  MODIFY `DiagnosisId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=386;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `LikeId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotificationId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `PostId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `fk_comments_post` FOREIGN KEY (`PostId`) REFERENCES `posts` (`PostId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `cropdetails`
--
ALTER TABLE `cropdetails`
  ADD CONSTRAINT `FK_CropDetails_Crops` FOREIGN KEY (`CropId`) REFERENCES `crops` (`CropId`) ON DELETE CASCADE;

--
-- Constraints for table `cropdiseases`
--
ALTER TABLE `cropdiseases`
  ADD CONSTRAINT `fk_cropdiseases_crop` FOREIGN KEY (`CropId`) REFERENCES `crops` (`CropId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cropdiseases_disease` FOREIGN KEY (`DiseaseId`) REFERENCES `diseases` (`DiseaseId`) ON DELETE CASCADE;

--
-- Constraints for table `crops`
--
ALTER TABLE `crops`
  ADD CONSTRAINT `fk_crops_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `imagediagnoses`
--
ALTER TABLE `imagediagnoses`
  ADD CONSTRAINT `fk_imagediagnoses_disease` FOREIGN KEY (`DiseaseId`) REFERENCES `diseases` (`DiseaseId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `fk_likes_post` FOREIGN KEY (`PostId`) REFERENCES `posts` (`PostId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_likes_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `fk_posts_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

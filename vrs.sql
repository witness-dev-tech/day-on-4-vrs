-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 04, 2026 at 02:09 PM
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
-- Database: `vrs`
--

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `nationalid` varchar(20) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `fullname`, `nationalid`, `phone`, `email`, `address`) VALUES
(1, 'John Doe', 'NID987654321', '+250788123456', 'johndoe@email.com', 'Kigali, Rwanda');

-- --------------------------------------------------------

--
-- Table structure for table `reservation_rental`
--

CREATE TABLE `reservation_rental` (
  `transaction_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `platenumber` varchar(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reservationdate` date DEFAULT curdate(),
  `startdate` date NOT NULL,
  `enddate` date NOT NULL,
  `reservationstatus` varchar(30) DEFAULT 'Pending',
  `rentaldate` date DEFAULT NULL,
  `returndate` date DEFAULT NULL,
  `rentalfee` decimal(10,2) NOT NULL,
  `rentalstatus` varchar(30) DEFAULT 'Not Started'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `username`, `password`, `role`) VALUES
(1, 'alice_ops', 'secure_hash_abc123', 'Staff'),
(2, 'witbri', '$2b$10$KnFW5eAbq.tQ7loFaqrXv.r27CstNzuThunXyUk/iewskC7T4vp.S', 'Staff');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle`
--

CREATE TABLE `vehicle` (
  `platenumber` varchar(20) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `year` int(11) NOT NULL,
  `vehicletype` varchar(30) NOT NULL,
  `purchase_price` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicle`
--

INSERT INTO `vehicle` (`platenumber`, `brand`, `model`, `year`, `vehicletype`, `purchase_price`, `status`) VALUES
('AE12', 'TOYOTA200', '200', 2026, 'SUV', 34556.00, 'Available'),
('RAA100A', 'Toyota', 'RAV4', 2023, 'SUV', 28000.00, 'Available'),
('RAB200B', 'Hyundai', 'Elantra', 2024, 'Sedan', 22000.00, 'Available');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `nationalid` (`nationalid`);

--
-- Indexes for table `reservation_rental`
--
ALTER TABLE `reservation_rental`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `fk_res_rental_customer` (`customer_id`),
  ADD KEY `fk_res_rental_vehicle` (`platenumber`),
  ADD KEY `fk_res_rental_user` (`user_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `vehicle`
--
ALTER TABLE `vehicle`
  ADD PRIMARY KEY (`platenumber`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reservation_rental`
--
ALTER TABLE `reservation_rental`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `reservation_rental`
--
ALTER TABLE `reservation_rental`
  ADD CONSTRAINT `fk_res_rental_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_res_rental_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_res_rental_vehicle` FOREIGN KEY (`platenumber`) REFERENCES `vehicle` (`platenumber`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

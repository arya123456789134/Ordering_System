SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `ordering_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `ordering_system`;

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `admin` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '$2y$10$OWwfF3pYIUPQwoBdb/BjNekyBaYGZAz0ZIDj3wmg3XKWANJB5VVYe', '2025-10-22 06:22:05');

CREATE TABLE `foods` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `foods` (`id`, `name`, `category`, `price`, `image`, `created_at`) VALUES
(3, 'Pan', 'shake', 2000.00, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWwAAAAbCAYAAABYz7V0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABKwSURBVHhe7Zx7XI73/8df1aiU7g53JUpROVaIkHJIOkphiVRIzhtmmGFOM8IOxrK+Zvj+xuxkbHbANoe67xIywsTo7nTX3enqrqulA+7394/qWvdV3YXZb9n1fDw+j4fP4foc3qeu6/P53LQYJUsQEBAQEPjHo9WeA3ZRUSEOHjjAL4ZIJMKChYv4xQIC/1oUinxIJBJkymSoqGBhZmaGgQNdMWr0aOjo6HDtLl5Mwfo31qKyshLxez+Cs7OLWj9PQ/jUKVi67FUMH+7Or3pstry1GZaWlpgzdx6/6rlGm1/QnigsLMSO7bFQqVQQiURc6ty5M7/pc0l2djYiI8Jx//59ftXfxvs738XhQ5/wix+b+XNjcCU1lV/8t/FPkOXT0NL8i4uKMCcmGmvXrIZBp04IC5uKl15eDG9vH6Rdv4agQH/cuvUb1377tlg4OTvjp1/Owt7eQa2vpyUl5QJKGYZf/ESkp9+CTJbBL37uadcBu4GIyCgsWLiISxGRUVzdw4cP8euVK5AkJoBpZCxVVVXIz89DeXk5kpKkqKmp4eoaUKlUuJ6WBkliAvLz87jyiooKFBUVqrWVy+WoqqoCAOTn56GqqgoZ9+5BkpiA0tJSrh3DMFAqlSgpLoYkMQGZmZmNeqmjoEABSWICrqelQaVSqZVXVlbi+vU0yDIyIMvIwMkff0Bmpgw1NdVqfbREbm4uJIkJyMrK4lfhzp3bdXOSybiyhw8fIicnByqVCqWlpUiSSiCXywEAlZWVkEgScfFiipo8WJZFUpIUly9fQkVFBVcOALW1tbh8+RIuXkxBdXWdvBiGwalTJ3Hz5g2Ul5ertUcb5N2SnprjwYMHuJKaiqQkKQoKFFx5W2SZKZNBkpiA9PRbXFltbS1ycnLU2pUUF0OpVAKt2EJlZSUKChSorq5CUpIU19PSQKT+wfvHH38gKUmqJi+00RYKCwsweVIIwqdH4MDB/0Pg+CCUlZUh4949aOtoIyxsKvbu24/5c+eguroKSqUSivx82NjY4H5lJTp16sSN1Zw9QoN/oV4v165excWLKXjw4IFaHTSsTalUgmEY5OTk4NcrV7jyjHv3IJUkgmVZrqyBxjbQWMZt8XM8gV+gkW5ZloVUksjZU8O6+Hbxl8AoWWqv6XyilADQ1bSbTeoYJUtX026SvYMDjRo9hqJmzCQTExPa8fY7xChZOnT4CIlEIrJ3cCAPD0/66eezas/euSsjewcHioiMonXrN5CLywB6dflKYpQsbdm6jTw8PNXaGxkZ0aHDR4hRsmRjY0MuAwbQGC8vCggcT4aGhvTV0ePEKFmaFj6devfuQ4NcXSk0dAqJRCJavWYt18/qNWvJwsKSZs6KJje3oeTs7EJ3fs8gRsmSk5Mz9e3bj5ycnCkyagb5+voRABo2bDidT5Sqzae59OryldS1azeKmTOPrK2tKSZmLjFKlhSFJeTn50+9e/eh6OgYsrW1pbCwqVTMlNHVtJsEgF56eTE5OTnTiBEepK2tTce/OUFfHj1GpqamZGXVleYvWEiMkqUvjx4jMzMzmjN3Hs2Knk0mJiaUnHKJGCVLqVeuka2tLQWOD6IJwSFkYWFJkqQLtG7DRtLR0aE+ffpS3J74JvPWJG9NeuKntBu3yM7OjoJDJtKSpa+QWCym+L37iFGyrcpyfNAEGjlqNK3bsJH8AwJp5KjRVFDEcDbYuG1A4HhOHppsIW5PPJlbWJDLgAEUNnUa2dnZ0VhvbyosLiVGydIXX31NZmZmFBo6hYJDJpJYLKaTp38mpo22EDJxEu3aHUeMkqXf0u+Qh+dIWvX6atq3/wAZGRlRyqVUYpQsRUfH0NfHvqVdu+Ooc+fO5OIygNat30BMK/aoyb/yC4pp9BgvcnTsRZMnh5LLgAGkq6vL+Yimtc1fsJDsHRzI1taWhgxxo5LSclq+4jUyNTWlsLCp1K9ff7K2tuZknH7nLjk5OZN/QCAtfWUZWVl15fTamp8zT+gXTL1uw6ZOo169etPgIUNIT0+fNm7aTI6OvcjDw5O0tbW5Nf1V6bkI2O/t3EWHDh+hQ4eP0NGvv+Hqg0MmUkDgeC7/xVdfk46ODt28dZsOHT5Curp6lCBJatIvo2Rp7779ZGnZhUpKy4lRspSZLadLl38lppUAwtQrctXrq7m6Va+vpp729sTUB+xRo8dQUYmSGCVLJ77/kbS1ten6zVskTU4hLS0tOpcgIUbJUlGJktzchlJ0dAwx9U4aGjqFm1PD+mVZuWpzaS6dPZdIWlpadPHSFWKULF1OvUozZs6izGw57Xj7HerSxYpy8wqIUbJ0+849MjQ0pI/3H+QC9rr1G7hxPTxH0oKFi4jhBSdGydLCRS9R7LYdXH6stzctXrKUGCVLfn7+FBo6havbuGkzffTxAWJ48uMnTfLWpCd++jB+L02PiOTy6zZspEGursS0Isvf0u8QAE52JaXllChNJkVhSZsCdku2ELcnnsRiMd25KyNGyZIsK5dEIhHt3befCotLycLCkrZs3cY9u2TpK+To2IuYNthCdm4+icViKihiqKS0nAYPGUJHPv+SGCVL92TZ5ODoyPUbEzOX8xsnJ2fuj2Zr9qjJv3a8/Q6JxWLKkSuIUbJ06fKv1LFjRzp0+Eira5u/YCE5OvaizGw5Nw8A9PMv54hRspQjV1Dfvv04GYdPj6DxQRPU5qGnp0/3ZNmt+vmT+gVTr1s/P3/KUxRSMVNGVlZdacQID27eAwcNotdW/an7vyI9F1siqamXIZVKIJVKkJp6iSs/f+4sXnwxlMuPG+cDIyMjXLiQDACwsDCHk5MzV9+YoUOH4f79SkRFTsfp06egq6sLe4e27+k17tc/IBCyjAwUFxUBAPr27csd9Hh4eMLAwACXLl5EwvnzcHBwhIvLAACAjo4OXgydAok0ketrjNdYaGlpcfm2kpBwHo6OveDg6AgA6Glvj53v74aRkRHOnTuHgIBA7hPY3MICY7zGQiqVcM9Hz57DjWtjY4OysjKurjFvbYnFzFnRSEw4jz1xHyA3JxfFxcUAgISEBAQEjufaLl6yVE0/T8Lj6GnqtHDs/mAPrl29iv8ePIAkqQQl9XPThLm5BVxcBmB29Ex8duRTlJWVoX9/J3Ts2JHftFk02UKXLlYQi8VA/WG5+wgPpCQnIz39FoqKCtXkMyVsKu7e/Z3bHtJkC3J5Lmzt7NChQwfcuHEdjx49gp+fPwDg4IGPMW6cDwCguroKFy4kY+iwYbwe0Ko9avIvqVQKH18/GBgYAADsHRygp6cH1O8/t7a2wUOGwMjICACQnCRF9+7d4Tp4MADAwMAAdj16cM+ePXMG/v4BXN7bexw6dHgBUkndPDX5+dP6RWTUDOjp6UNbWxtmZmYYHzSBm7eVVVeUlzfvJ0/KcxGwV772OrbGbsfW2O1Y+drrXDnLsjA1NVVrKxKJUMr8ucfVEt27d4c0+SIGDhyIHdtj0duxJ+I/3MNv1iaMjU2A+vk0h7GxMViWRXl5eQvzffqDmvKyMpibm/OLAQBseTlMmhmXvyfZFj7/7AjcBg/CTz+dhpOTE3r36QMAqKmpQXV1VYtzeFIeR09p165hqJsr4uJ2QywWw8PDk9+kWXR0dPD9j6cQHRODY8eOwrl/HyxcMK/ZfdnWaJstlIOt38tvrBeRSATU7/m3hrGxMWc3NTU1qK6qRk5ODuI+2I1Tp07C3sEBDMNgwfx5WL5iJRdYG9OaPWryL6akpEVdP+7aSkoYiFvoCwBYthwHD+5HZEQ4IiPCERU5HZ4jR0G3/g+EJv4uv/ireC4CdksYGxujoKCAy6tUKhQWFraoID7W1tZYsXIVzpxNwNvv7sQba1dDocgH6g+b2kqDgYuMjflVQL2RGhsbw8TERO0gDAAUCgXMzS3Uyp4EYxMTFPIO7howbmbcAoUCFo85blFRIRa/vAjx/9mLt7bEYvQYLxgaGgIAdHV1oa+v3+IcWkOTvDXpqTELF8xDaGgYPt5/EEETgmFp2YXfpEUMDAwQHR2Dr44eR0JiEr478S2+/fYbrl7T/BrTmi2UMgyMjU1gbFIX2Bvbb4Gi7t9tsYcuXaxgYmqKJKkEQ4a4IWhCMHZsj4Xb0KH4aN8BpF27hu2xW7Fs2XJMnDSZ/zgAtGqPmvxLbG6OwsLmdf24axObi1HUQl8AYGpqhoiIKBz+9DO15Ovrx2/ahL/DL/5KnuuA7ePji6+PfsWdvH//3QkQAZ4jR/GbNiErKwtnz5zh8i4udfdRVSoVOnXqhMysTM5J/3vwQJPbEImJCdy43534Fn369OU+fVNTL3PXr86eOYPa2loMd3fH2LHeyM3NRWrqZaA+CHxz/Bh8/Zo3vIa3tQajys/Pw9s7tuHRo0e8lsAYLy/IMjJw+3Y6AOBKair69nZEYWEBfHx88fPPP3E3NHJzc5GcnASfFsZtTGOnrWAroFKpYGXVFQBARNynPwB4jfXGD99/z+WjIqfjzU0bgPp+FDznaECTvDXpiU9ZWRmsrKy4fGNH5cuyMRUVFfjm+DHujdrWzg5GRiKoVCoYdKp7M/399zsAUHcDJuWC2vOabEEuz4Uso+56WklxMS5cSIbnyJHo06cvrK2tcfTol1w/X3zxOQa5unLPNqa5+e/aHYelSxcjOUmK1WvWIm5PPIYNGw47Ozvs2h2HdRs2YsDAgY16Uac1e9TkX2PGeOH0qZPcjY1fr1xBZWUlADz22kaPGoO8vDxui6OkpATpja4i+vj64ovPP+PsPjc3FwF+Prhx4zrXpjGpqZdx6tRJ4Bn6xbPiuQ7YG9/cjFJlKbzHjsbMGZFYuXI59nwYDzMzM37TJujr62Hr1s2YFhaK11auQET4VKx9Yx26dbOGj68vtLS04DZ4IIa6uSInJ7vJ21ratWsYM8oTvj5jcfjwJ3jnvZ1cXXVVNby9RiMkOAjRs6Lw1pZYWFp2gYOjI7bGbsf0aWGYExON0SM9YCY2w4qVq9T6bsDa2hqDXF0xIyoCO7bHIiXlAqRSqdoPIRpwdnbB6jVrMXliCGZERSAyIhxz5s6FpWUXhE+PwNix3hjl6Y55c2bDz8cbc+bOg4+PL7+bJgRNCMbJH3+AzzgvmJiawj8gEC9ODsHCBfMQ6O+LsvIyKBR1QeStLbG4nZ6OAD8fBAX6I+PePcycNRsAEBwyETu2xWLmjEjeCHUO2ZK8NemJz4KFi7BxwzrMnxuDSRODkZhQdwWspqa6iSwb06lTJ5w+fQo+3l5Ys3oV/P3GYYibG0JCJqJHz55wdx+B4KBAjPRwx673d8LVtW6vtQFNttCxoy5mR8/E5EkhcB/uBj8/fwRNCIaOjg7i9+7Dvr17MS0sFCHBQTh79hfE7YlX67uB5ubfr19/HDt+AocPfYLgCeOx4tVl2PzmJixZ/BJmREW0en++NXvU5F/h0yPgPsIDniOGY/KkEGzatAEdOtTt+T/u2hwcHfHGuvWIjAjHi5NDEDp5ItcXALyxbgP09PXh5+uNZa8sQVCgH8Z6e7f4o58zv/zCrf1Z+cWzol3/0rGtyOVyVFb+ATu7HtDV1eVXa0ShyEdpaSlsbe24z3vU7wtmZ2fByqorOnfuDJZloa+vjw4dOmCgS39sjd2OYcPdUVxchB49enLjvrRoAUQiEdZv2IiMjAzY2HTnDikaqKqqQlZWJkxNTZv8IeBTW1uL7OwsdO/eHe+9+y6sra0RNWMmvxlHRUUF5PJcWFvbNPmBkVKpRH5+XrNz0kRBgQIqlQpdu3YD6t8Ui0uK0bOnPbS0tFBTU8ONRUTIysyEto4ObGxsoK1d985ARMiUyWAmFnP7mY3RJG9o0BOfhvV362YNQ0NDVFRUoHPnztDW1laTpa5u0/3PsrIy5OXJYWFuAXOLPz+LVSoVsrOyYGBoAAsLS9y/fx/a2lrQ09PXaAufHfkU/4n/EOcSJLh793eIRCJ06fLnFwAAPHr0CJkyGXR0dGDXo0eLh4zg2QJ//o8ePQLDlKC6ugZmZmbN7lmj/g5xx44d1Q5UW7NHTf6VlydHbU0tevTs2URnj7M21Mu/sLAAPXr0xMOHDzkZN9BgA3Z2PVpcX0s8C794FvwrAvbfTYOTBo4P4ldxAXtr7HZ+1VNz4UIy+vd3+n83KoE/0WQLDQE7QZLErxIQaJbnekvk34a7+wghWAsIPMcIb9jPgHNnz6Jf/37Nfj5eT0vDCx1eQL9+/flVAs8hmmxBLpcjK1PWpkNwAQEIAVtAQECg/aBF/P9tRkBAQEDgH4mwhy0gICDQThACtoCAgEA7QQjYAgICAu0EIWALCAgItBOEgC0gICDQThACtoCAgEA7QQjYAgICAu0EIWALCAgItBOEgC0gICDQThACtoCAgEA74X96iIKQ/sks1wAAAABJRU5ErkJggg==', '2025-10-22 23:24:08');

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `tracking_number` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','ready','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `orders` (`id`, `tracking_number`, `customer_name`, `total_amount`, `status`, `created_at`) VALUES
(19, 'ORD202510297040', 'Mark', 2000.00, 'pending', '2025-10-29 15:34:01');

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `food_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_items` (`id`, `order_id`, `food_id`, `quantity`, `price`) VALUES
(19, 19, 3, 1, 2000.00);

CREATE TABLE `order_history` (
  `id` int(11) NOT NULL,
  `original_order_id` int(11) NOT NULL,
  `tracking_number` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'completed',
  `order_date` timestamp NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `order_history_items` (
  `id` int(11) NOT NULL,
  `order_history_id` int(11) NOT NULL,
  `food_id` int(11) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tracking_number` (`tracking_number`);

ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `food_id` (`food_id`);

ALTER TABLE `order_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `original_order_id` (`original_order_id`),
  ADD KEY `order_date` (`order_date`),
  ADD KEY `completed_at` (`completed_at`);

ALTER TABLE `order_history_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_history_id` (`order_history_id`),
  ADD KEY `food_id` (`food_id`);

ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `foods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

ALTER TABLE `order_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `order_history_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_history_items`
  ADD CONSTRAINT `order_history_items_ibfk_1` FOREIGN KEY (`order_history_id`) REFERENCES `order_history` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_history_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE;
COMMIT;

;
;
;
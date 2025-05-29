<?php

$dogru_kullanici = "admin";
$dogru_sifre = "12345";


$kullanici = $_POST['username'];
$sifre = $_POST['password'];


if ($kullanici === $dogru_kullanici && $sifre === $dogru_sifre) {
    
    header("Location: anasayfa.html");
    exit();
} else {
    echo "Kullanıcı adı veya şifre yanlış!";
}
?>

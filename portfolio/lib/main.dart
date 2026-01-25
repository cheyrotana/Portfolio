import 'package:flutter/material.dart';
import 'package:portfolio/components/about_me.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Portfolio',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: Scaffold(
        backgroundColor: Colors.green,
        body: SingleChildScrollView(child: Column(children: [AboutMe()])),
      ),
    );
  }
}

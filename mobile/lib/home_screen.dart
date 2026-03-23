import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:async';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _hasAgreed = false;
  bool _isLoadingAgreement = true;
  StreamSubscription<DocumentSnapshot>? _userSub;

  final List<Widget> _pages = [
    const _DashboardTab(),
    const _TasksTab(),
    const _AuditsTab(),
    const _DocsTab(),
  ];

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _userSub = FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .snapshots()
          .listen((docSnap) {
            if (docSnap.exists) {
              final data = docSnap.data() as Map<String, dynamic>;
              setState(() {
                _hasAgreed = data['hasAgreedToTerms'] == true;
                _isLoadingAgreement = false;
              });
            }
          });
    } else {
      setState(() => _isLoadingAgreement = false);
    }
  }

  @override
  void dispose() {
    _userSub?.cancel();
    super.dispose();
  }

  Future<void> _agreeToTerms() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'hasAgreedToTerms': true,
      }, SetOptions(merge: true));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingAgreement) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A1530),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF2DD4BF)),
        ),
      );
    }

    if (!_hasAgreed) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A1530),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF132040),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.red.withValues(alpha: 77)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.redAccent,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'CONFIDENTIALITY & DUTY TO ACT',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const SizedBox(
                      height: 260,
                      child: SingleChildScrollView(
                        child: SelectableText(
                          'AMERICAN RED CROSS STANDARD OF CARE:\nBy accessing this system, you acknowledge and agree to uphold the American Red Cross standard of care for professional lifeguards. You recognize your legal Duty to Act while on active duty at the Silliman Activity and Family Aquatic Center (City of Newark: https://www.newark.org/departments/recreation-and-community-services/silliman-activity-and-family-aquatic-center).\n\nSTRICT CONFIDENTIALITY:\nThis application, including all medical Incident Reports, Rescue documentation, Employee certifications, and internal facility operations, contains highly confidential information that is legally privileged. If you are not an active, authorized employee, you are legally notified that any unauthorized disclosure, photography, copying, distribution, or use of any information contained within this system is strictly prohibited by law.',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            height: 1.6,
                          ),
                          textAlign: TextAlign.justify,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => FirebaseAuth.instance.signOut(),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: Colors.white24),
                            ),
                            child: const Text(
                              'Disagree / Exit',
                              style: TextStyle(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _agreeToTerms,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text(
                              'I Agree',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _pages),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('AquaTrack AI coming soon to mobile!'),
            ),
          );
        },
        backgroundColor: const Color(0xFF2DD4BF),
        child: const Icon(Icons.auto_awesome, color: Color(0xFF0A1530)),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.white.withValues(alpha: 13)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0A1530),
          selectedItemColor: const Color(0xFF2DD4BF),
          unselectedItemColor: Colors.white54,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.check_circle_outline),
              label: 'Tasks',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.verified_user_outlined),
              label: 'Audits',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.folder_outlined),
              label: 'Docs',
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();
  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AquaTrack',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.account_circle_outlined,
              color: Colors.white,
            ),
            onPressed: () {
              // Quick logout for now
              FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome, ${user?.email?.split('@')[0] ?? 'User'}!',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          // Quick Actions Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00D4FF), Color(0xFF2DD4BF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Today\'s Shift',
                  style: TextStyle(
                    color: Color(0xFF0A1530),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Morning (5:30 AM - 9:30 AM)',
                  style: TextStyle(
                    color: Color(0xFF0A1530),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: Color(0xFF0A1530),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      '0 of 4 tasks completed',
                      style: TextStyle(
                        color: Color(0xFF0A1530),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TasksTab extends StatelessWidget {
  const _TasksTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Shift Tasks',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: const Center(
        child: Text(
          'Tasks list will mirror web app',
          style: TextStyle(color: Colors.white54),
        ),
      ),
    );
  }
}

class _AuditsTab extends StatelessWidget {
  const _AuditsTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Staff Directory (Live)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('staff').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF2DD4BF)),
            );
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Error: ${snapshot.error}',
                style: const TextStyle(color: Colors.red),
              ),
            );
          }
          final staffDocs = snapshot.data?.docs ?? [];
          if (staffDocs.isEmpty) {
            return const Center(
              child: Text(
                'No staff found in database',
                style: TextStyle(color: Colors.white54),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: staffDocs.length,
            itemBuilder: (context, index) {
              final data = staffDocs[index].data() as Map<String, dynamic>;
              final name = '${data['firstName']} ${data['lastName']}';
              final isGraduating = data['isHighSchool'] == true;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF132040),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 13)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFF2DD4BF).withValues(alpha: 51),
                      child: Text(
                        name[0],
                        style: const TextStyle(
                          color: Color(0xFF2DD4BF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Position: ${data['positionId'] ?? 'Unknown'}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isGraduating)
                      const Icon(Icons.school, color: Colors.orange, size: 20),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _DocsTab extends StatelessWidget {
  const _DocsTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Document Library',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: const Center(
        child: Text(
          'Role-filtered documents',
          style: TextStyle(color: Colors.white54),
        ),
      ),
    );
  }
}

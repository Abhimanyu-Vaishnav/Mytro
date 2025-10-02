from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Profile, Follow, Story, Conversation, ConversationMessage
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        # Create sample users
        users_data = [
            {'username': 'sarah_johnson', 'first_name': 'Sarah', 'last_name': 'Johnson', 'email': 'sarah@example.com'},
            {'username': 'mike_chen', 'first_name': 'Mike', 'last_name': 'Chen', 'email': 'mike@example.com'},
            {'username': 'emma_wilson', 'first_name': 'Emma', 'last_name': 'Wilson', 'email': 'emma@example.com'},
            {'username': 'john_doe', 'first_name': 'John', 'last_name': 'Doe', 'email': 'john@example.com'},
            {'username': 'alice_smith', 'first_name': 'Alice', 'last_name': 'Smith', 'email': 'alice@example.com'},
        ]
        
        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'email': user_data['email'],
                    'is_active': True
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username}')
            created_users.append(user)
        
        # Get current user (assuming first user exists)
        try:
            current_user = User.objects.first()
            if not current_user:
                self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
                return
        except:
            self.stdout.write(self.style.ERROR('Error getting current user'))
            return
        
        # Create follow relationships
        for user in created_users:
            if user != current_user:
                Follow.objects.get_or_create(
                    follower=current_user,
                    following=user
                )
                Follow.objects.get_or_create(
                    follower=user,
                    following=current_user
                )
        
        # Create sample stories
        story_data = [
            {'user': created_users[0], 'text': 'Having a great day!', 'bg': '#ff6b35'},
            {'user': created_users[1], 'text': 'Working on new projects', 'bg': '#42b883'},
            {'user': created_users[2], 'text': 'Beautiful sunset today', 'bg': '#f7931e'},
        ]
        
        for data in story_data:
            Story.objects.get_or_create(
                user=data['user'],
                story_type='text',
                defaults={
                    'text_content': data['text'],
                    'background_color': data['bg'],
                    'expires_at': timezone.now() + timedelta(hours=24)
                }
            )
        
        # Create sample conversations
        for user in created_users[:3]:
            conversation, created = Conversation.objects.get_or_create(
                is_group=False
            )
            if created:
                conversation.participants.add(current_user, user)
                
                # Add sample messages
                messages = [
                    {'sender': user, 'content': f'Hey! How are you doing?'},
                    {'sender': current_user, 'content': 'I\'m doing great! Thanks for asking.'},
                    {'sender': user, 'content': 'That\'s awesome! Want to catch up later?'},
                ]
                
                for i, msg_data in enumerate(messages):
                    ConversationMessage.objects.create(
                        conversation=conversation,
                        sender=msg_data['sender'],
                        content=msg_data['content'],
                        timestamp=timezone.now() - timedelta(minutes=30-i*5)
                    )
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))
from django import forms
from .models import Interest, Profile, Post, Comment  # Agar Post model bhi use karna hai
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django_select2.forms import Select2TagWidget
from django.utils.safestring import mark_safe

class CustomSignupForm(UserCreationForm):
    # Basic Info
    first_name = forms.CharField(max_length=30, required=True, label="First Name")
    last_name = forms.CharField(max_length=30, required=True, label="Last Name")
    email = forms.EmailField(required=True)
    
    # Profile Info
    profile_pic = forms.ImageField(required=False, label="Profile Picture")
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False, max_length=500, label="Bio")
    gender = forms.ChoiceField(choices=[('', 'Select Gender'), ('M', 'Male'), ('F', 'Female'), ('O', 'Other')], required=False)
    dob = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=False, label="Date of Birth")
    phone_number = forms.CharField(max_length=15, required=False, label="Phone Number")
    location = forms.CharField(max_length=100, required=False, label="Location")
    website = forms.URLField(required=False, label="Website")
    
    # Interests
    interests = forms.CharField(required=False, label="Interests (comma separated)", 
                               help_text="e.g., Technology, Music, Sports")

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add CSS classes
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field_name == 'password1':
                field.help_text = 'Password must be at least 8 characters long'
            elif field_name == 'username':
                field.help_text = 'Username must be unique and can contain letters, numbers, and @/./+/-/_ only'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']

        if commit:
            user.save()
            
            # Create or update profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.profile_pic = self.cleaned_data.get('profile_pic')
            profile.bio = self.cleaned_data.get('bio', '')
            profile.gender = self.cleaned_data.get('gender', '')
            profile.dob = self.cleaned_data.get('dob')
            profile.phone_number = self.cleaned_data.get('phone_number', '')
            profile.location = self.cleaned_data.get('location', '')
            profile.website = self.cleaned_data.get('website', '')
            profile.save()
            
            # Handle interests
            interests_text = self.cleaned_data.get('interests', '')
            if interests_text:
                interest_names = [name.strip() for name in interests_text.split(',') if name.strip()]
                for interest_name in interest_names:
                    interest, created = Interest.objects.get_or_create(name=interest_name)
                    profile.interests.add(interest)
                    
        return user


# class ProfileForm(forms.ModelForm):
#     class Meta:
#         model = Profile
#         fields = ['bio', 'profile_pic', 'location', 'language_preference']


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'email']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = [
            'profile_pic', 'bio', 'location', 'language_preference',
            'gender', 'dob', 'website', 'phone_number', 'interests'
        ]
        widgets = {
            'profile_pic': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'bio': forms.Textarea(attrs={'class': 'form-control'}),
            'location': forms.TextInput(attrs={'class': 'form-control'}),
            'language_preference': forms.TextInput(attrs={'class': 'form-control'}),
            'gender': forms.Select(attrs={'class': 'form-control'}),
            'dob': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'website': forms.URLInput(attrs={'class': 'form-control'}),
            'phone_number': forms.TextInput(attrs={'class': 'form-control'}),
            'interests': Select2TagWidget(attrs={'class': 'form-control', 'data-placeholder': 'Type or select interests'}),
        }

    def save(self, commit=True):
        profile = super().save(commit=False)
        if commit:
            profile.save()

        print("Raw POST interests:", self.data.getlist('interests'))
        print("Cleaned interests:", self.cleaned_data.get('interests'))

        interests_data = self.cleaned_data['interests']
        interests_list = []

        for interest in interests_data:
            if isinstance(interest, str):
                obj, created = Interest.objects.get_or_create(name=interest)
                interests_list.append(obj)
            else:
                interests_list.append(interest)

        profile.interests.set(interests_list)
        if commit:
            profile.save()
        return profile



class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']
        widgets = {
            'content': forms.Textarea(attrs={
                'placeholder': "What's on your mind?", 
                'rows': 4, 
                'class': 'form-control'
            }),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']



        